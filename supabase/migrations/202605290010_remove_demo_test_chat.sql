-- 공용 테스트 채팅방 데이터를 제거한다.

delete from public.chat_messages
where thread_id = 'demo-test-chat';

update public.chats
set
  payload = coalesce((
    select jsonb_agg(context)
    from jsonb_array_elements(payload) as context
    where context->>'id' <> 'demo-test-chat'
  ), '[]'::jsonb),
  updated_at = now()
where state_key = 'toad.chatContexts'
  and jsonb_typeof(payload) = 'array';

update public.demo_app_state
set
  payload = coalesce((
    select jsonb_agg(context)
    from jsonb_array_elements(payload) as context
    where context->>'id' <> 'demo-test-chat'
  ), '[]'::jsonb),
  updated_at = now()
where state_key = 'toad.chatContexts'
  and jsonb_typeof(payload) = 'array';
