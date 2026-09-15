-- Run this migration with `supabase db push` or paste it into the SQL editor.
create extension if not exists pgcrypto;

create table public.games (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  host_id uuid not null references auth.users(id) on delete cascade,
  guest_id uuid references auth.users(id) on delete set null,
  variant text not null default 'ultimate' check (variant in ('ultimate', 'classic')),
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  current_mark smallint not null default 1 check (current_mark in (1, 4)),
  forced_board smallint not null default 4 check (forced_board between 0 and 8),
  board_results smallint[] not null default array[0,0,0,0,0,0,0,0,0]::smallint[],
  winner smallint check (winner in (0, 1, 4)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.moves (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  mark smallint not null check (mark in (1, 4)),
  board smallint not null check (board between 0 and 8),
  cell smallint not null check (cell between 0 and 8),
  created_at timestamptz not null default now(),
  unique (game_id, board, cell)
);

alter table public.games enable row level security;
alter table public.moves enable row level security;

create policy "players can read their games" on public.games for select
to authenticated using (auth.uid() in (host_id, guest_id));
create policy "players can read game moves" on public.moves for select
to authenticated using (exists (
  select 1 from public.games g where g.id = game_id and auth.uid() in (g.host_id, g.guest_id)
));

create or replace function public.has_line(values_ smallint[], mark_ smallint)
returns boolean language sql immutable set search_path = '' as $$
  select (values_[1]=mark_ and values_[2]=mark_ and values_[3]=mark_)
      or (values_[4]=mark_ and values_[5]=mark_ and values_[6]=mark_)
      or (values_[7]=mark_ and values_[8]=mark_ and values_[9]=mark_)
      or (values_[1]=mark_ and values_[4]=mark_ and values_[7]=mark_)
      or (values_[2]=mark_ and values_[5]=mark_ and values_[8]=mark_)
      or (values_[3]=mark_ and values_[6]=mark_ and values_[9]=mark_)
      or (values_[1]=mark_ and values_[5]=mark_ and values_[9]=mark_)
      or (values_[3]=mark_ and values_[5]=mark_ and values_[7]=mark_)
$$;

create or replace function public.create_game(variant_ text default 'ultimate')
returns public.games language plpgsql security definer set search_path = public as $$
declare new_game public.games; new_code text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if variant_ not in ('ultimate', 'classic') then raise exception 'invalid variant'; end if;
  loop
    new_code := upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 6));
    begin
      insert into games(code, host_id, variant, forced_board)
      values (new_code, auth.uid(), variant_, case when variant_='classic' then 4 else 4 end)
      returning * into new_game;
      return new_game;
    exception when unique_violation then null;
    end;
  end loop;
end $$;

create or replace function public.join_game(code_ text)
returns public.games language plpgsql security definer set search_path = public as $$
declare joined public.games;
begin
  update games set guest_id=auth.uid(), status='active', updated_at=now()
  where code=upper(trim(code_)) and status='waiting' and host_id<>auth.uid()
  returning * into joined;
  if joined.id is null then raise exception 'game not found or already started'; end if;
  return joined;
end $$;

create or replace function public.play_remote_move(game_id_ uuid, board_ smallint, cell_ smallint)
returns public.games language plpgsql security definer set search_path = public as $$
declare g public.games; expected_mark smallint; cells smallint[]; board_full boolean; i int; next_board int; game_full boolean;
begin
  select * into g from games where id=game_id_ for update;
  if g.id is null or g.status<>'active' then raise exception 'game is not active'; end if;
  expected_mark := case when auth.uid()=g.host_id then 1 when auth.uid()=g.guest_id then 4 else null end;
  if expected_mark is null or expected_mark<>g.current_mark then raise exception 'not your turn'; end if;
  if g.variant='classic' and board_<>4 then raise exception 'invalid board'; end if;
  if g.variant='ultimate' and board_<>g.forced_board then raise exception 'invalid board'; end if;
  if g.board_results[board_+1]<>0 then raise exception 'board is closed'; end if;

  insert into moves(game_id, player_id, mark, board, cell) values(g.id, auth.uid(), expected_mark, board_, cell_);
  select array_agg(coalesce(m.mark,0) order by n) into cells
  from generate_series(0,8) n left join moves m on m.game_id=g.id and m.board=board_ and m.cell=n;
  board_full := not (0=any(cells));
  if has_line(cells, expected_mark) then g.board_results[board_+1]:=expected_mark;
  elsif board_full then g.board_results[board_+1]:=13;
  end if;

  if (g.variant='classic' and has_line(cells, expected_mark))
     or (g.variant='ultimate' and has_line(g.board_results, expected_mark)) then
    g.status:='finished'; g.winner:=expected_mark;
  else
    game_full := not (0=any(g.board_results));
    if g.variant='classic' then game_full:=board_full;
    end if;
    if game_full then g.status:='finished'; g.winner:=0;
    else
      next_board:=case when g.variant='classic' then 4 else cell_ end;
      if g.variant='ultimate' then
        for i in 0..8 loop
          if g.board_results[((next_board+i)%9)+1]=0 then next_board:=(next_board+i)%9; exit; end if;
        end loop;
      end if;
      g.forced_board:=next_board; g.current_mark:=case expected_mark when 1 then 4 else 1 end;
    end if;
  end if;
  update games set board_results=g.board_results, forced_board=g.forced_board,
    current_mark=g.current_mark, status=g.status, winner=g.winner, updated_at=now() where id=g.id returning * into g;
  return g;
end $$;

revoke all on function public.create_game(text), public.join_game(text), public.play_remote_move(uuid,smallint,smallint) from public;
grant execute on function public.create_game(text), public.join_game(text), public.play_remote_move(uuid,smallint,smallint) to authenticated;

alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.moves;
