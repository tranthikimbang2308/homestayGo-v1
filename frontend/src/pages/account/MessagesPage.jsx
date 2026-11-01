import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { ArrowLeft, Home, Loader2, MessageCircle, Search, SendHorizontal } from 'lucide-react';
import client, { getErrorMessage } from '../../api/client.js';
import AccountShell from '../../components/AccountShell.jsx';
import Avatar from '../../components/Avatar.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const POLL_INTERVAL = 5000;

const ROLE_LABELS = { owner: 'Chủ phòng', customer: 'Khách hàng', admin: 'Quản trị viên' };

const listTime = (value) => {
  if (!value) return '';
  const date = dayjs(value);
  const now = dayjs();
  if (date.isSame(now, 'day')) return date.format('HH:mm');
  if (date.isSame(now.subtract(1, 'day'), 'day')) return 'Hôm qua';
  if (date.isSame(now, 'year')) return date.format('DD/MM');
  return date.format('DD/MM/YYYY');
};

const dayLabel = (value) => {
  const date = dayjs(value);
  const now = dayjs();
  if (date.isSame(now, 'day')) return 'Hôm nay';
  if (date.isSame(now.subtract(1, 'day'), 'day')) return 'Hôm qua';
  return date.format('DD/MM/YYYY');
};

const otherOf = (conversation, userId) =>
  conversation?.otherUser || conversation?.participants?.find((p) => String(p._id) !== String(userId)) || null;

function ConversationList({ conversations, activeId, onSelect, userId, loading, keyword, onKeywordChange }) {
  const filtered = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((c) => {
      const other = otherOf(c, userId);
      return [other?.name, c.room?.title, c.lastMessage].some((text) => String(text || '').toLowerCase().includes(term));
    });
  }, [conversations, keyword, userId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className="input pl-9"
            placeholder="Tìm hội thoại"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex gap-3 rounded-lg p-3">
                <span className="h-11 w-11 animate-pulse rounded-full bg-line/60" />
                <div className="flex-1 space-y-2">
                  <span className="block h-3.5 w-1/2 animate-pulse rounded bg-line/60" />
                  <span className="block h-3 w-3/4 animate-pulse rounded bg-line/60" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted">
            {conversations.length === 0 ? 'Chưa có hội thoại nào' : 'Không tìm thấy hội thoại phù hợp'}
          </div>
        ) : (
          <ul className="space-y-0.5 p-2">
            {filtered.map((conversation) => {
              const other = otherOf(conversation, userId);
              const active = String(conversation._id) === String(activeId);
              const unread = conversation.unreadCount > 0;
              return (
                <li key={conversation._id}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation._id)}
                    className={`flex w-full gap-3 rounded-lg p-3 text-left transition-colors ${active ? 'bg-primary-light' : 'hover:bg-sand'}`}
                  >
                    <Avatar src={other?.avatar} name={other?.name} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-sm ${unread ? 'font-semibold' : 'font-medium'}`}>{other?.name || 'Người dùng'}</span>
                        <span className="shrink-0 text-[11px] text-muted">{listTime(conversation.lastMessageAt)}</span>
                      </span>
                      {conversation.room?.title && <span className="block truncate text-xs text-primary">{conversation.room.title}</span>}
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className={`truncate text-xs ${unread ? 'font-medium text-ink' : 'text-muted'}`}>
                          {conversation.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                        </span>
                        {unread && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-white">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChatPanel({ conversationId, summary, userId, onBack, onSent, onRead }) {
  const [conversation, setConversation] = useState(summary || null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  const fetchMessages = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await client.get(`/messages/conversations/${conversationId}`, { params: { limit: 100 } });
        const data = res.data.data || {};
        const nextMessages = data.messages || [];
        setConversation(data.conversation || null);
        const lastId = nextMessages[nextMessages.length - 1]?._id || null;
        if (lastId !== lastMessageIdRef.current || !silent) {
          lastMessageIdRef.current = lastId;
          setMessages(nextMessages);
          scrollToBottom();
        }
        setError('');
        onRead?.(conversationId);
      } catch (err) {
        if (!silent) setError(getErrorMessage(err, 'Không tải được tin nhắn'));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [conversationId, onRead, scrollToBottom]
  );

  useEffect(() => {
    lastMessageIdRef.current = null;
    setMessages([]);
    setDraft('');
    fetchMessages(false);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') fetchMessages(true);
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [conversationId, fetchMessages]);

  const send = async (event) => {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await client.post(`/messages/conversations/${conversationId}`, { content });
      const message = res.data.data;
      lastMessageIdRef.current = message._id;
      setMessages((prev) => [...prev, message]);
      setDraft('');
      scrollToBottom();
      onSent?.(conversationId, message);
      textareaRef.current?.focus();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không gửi được tin nhắn'));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) send(event);
  };

  const other = otherOf(conversation || summary, userId);
  const room = (conversation || summary)?.room;

  const grouped = useMemo(() => {
    const groups = [];
    messages.forEach((message) => {
      const key = dayjs(message.createdAt).format('YYYY-MM-DD');
      const last = groups[groups.length - 1];
      if (!last || last.key !== key) groups.push({ key, label: dayLabel(message.createdAt), items: [message] });
      else last.items.push(message);
    });
    return groups;
  }, [messages]);

  const lastMine = [...messages].reverse().find((m) => String(m.sender) === String(userId));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-line px-3 py-3 sm:px-4">
        <button type="button" onClick={onBack} className="rounded-lg p-1.5 text-muted hover:bg-sand hover:text-ink lg:hidden" aria-label="Quay lại danh sách">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar src={other?.avatar} name={other?.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{other?.name || 'Đang tải...'}</p>
          <p className="truncate text-xs text-muted">{ROLE_LABELS[other?.role] || ''}</p>
        </div>
        {room?.slug && (
          <Link
            to={`/rooms/${room.slug}`}
            className="hidden max-w-[45%] items-center gap-2 rounded-lg border border-line px-2 py-1.5 text-xs text-ink hover:border-primary hover:text-primary sm:flex"
          >
            {room.images?.[0] ? (
              <img src={room.images[0]} alt={room.title} className="h-7 w-7 shrink-0 rounded object-cover" />
            ) : (
              <Home className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate">{room.title}</span>
          </Link>
        )}
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-sand/60 px-3 py-4 sm:px-5">
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-danger">{error}</div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageCircle className="h-7 w-7 text-muted" />
            <p className="mt-2 text-sm text-muted">Hãy gửi lời chào để bắt đầu cuộc trò chuyện</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map((group) => (
              <div key={group.key} className="space-y-2">
                <div className="flex justify-center">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] text-muted ring-1 ring-line">{group.label}</span>
                </div>
                {group.items.map((message) => {
                  const mine = String(message.sender) === String(userId);
                  return (
                    <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] sm:max-w-[70%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div
                          className={`whitespace-pre-line break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                            mine ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-line bg-white text-ink'
                          }`}
                        >
                          {message.content}
                        </div>
                        <span className="mt-1 px-1 text-[11px] text-muted">
                          {dayjs(message.createdAt).format('HH:mm')}
                          {mine && lastMine?._id === message._id && (message.readAt ? ' · Đã xem' : ' · Đã gửi')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={send} className="flex items-end gap-2 border-t border-line bg-white p-3">
        <textarea
          ref={textareaRef}
          rows={1}
          value={draft}
          maxLength={2000}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn, Enter để gửi"
          className="input max-h-32 min-h-[42px] resize-none"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="btn btn-primary h-[42px] w-[42px] shrink-0 px-0"
          aria-label="Gửi tin nhắn"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}

function MessagesContent({ embedded }) {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const activeId = params.get('c') || '';
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');

  const loadConversations = useCallback(async (silent = false) => {
    try {
      const res = await client.get('/messages/conversations');
      setConversations(res.data.data || []);
      setError('');
    } catch (err) {
      if (!silent) setError(getErrorMessage(err, 'Không tải được hội thoại'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations(false);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') loadConversations(true);
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [loadConversations]);

  const select = (id) => setParams(id ? { c: id } : {});

  const handleRead = useCallback((id) => {
    setConversations((prev) => prev.map((c) => (String(c._id) === String(id) && c.unreadCount ? { ...c, unreadCount: 0 } : c)));
  }, []);

  const handleSent = useCallback((id, message) => {
    setConversations((prev) => {
      const target = prev.find((c) => String(c._id) === String(id));
      if (!target) return prev;
      const updated = { ...target, lastMessage: message.content, lastMessageAt: message.createdAt, unreadCount: 0 };
      return [updated, ...prev.filter((c) => String(c._id) !== String(id))];
    });
  }, []);

  const activeSummary = conversations.find((c) => String(c._id) === String(activeId));
  const heightClass = embedded ? 'h-[calc(100vh-11rem)] min-h-[480px]' : 'h-[calc(100vh-15rem)] min-h-[520px]';

  if (error && !conversations.length) {
    return <EmptyState title="Không tải được hội thoại" description={error} />;
  }

  if (!loading && conversations.length === 0 && !activeId) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Chưa có tin nhắn"
        description={
          user?.role === 'owner'
            ? 'Khi khách hàng nhắn tin hỏi về phòng, hội thoại sẽ xuất hiện tại đây.'
            : 'Bấm "Nhắn tin cho chủ phòng" trên trang chi tiết phòng để bắt đầu trò chuyện.'
        }
        action={
          user?.role !== 'owner' ? (
            <Link to="/rooms" className="btn btn-primary">
              Khám phá homestay
            </Link>
          ) : null
        }
      />
    );
  }

  return (
    <div className={`card grid overflow-hidden lg:grid-cols-[320px_1fr] ${heightClass}`}>
      <div className={`min-h-0 border-line lg:block lg:border-r ${activeId ? 'hidden' : 'block'}`}>
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={select}
          userId={user?._id}
          loading={loading}
          keyword={keyword}
          onKeywordChange={setKeyword}
        />
      </div>
      <div className={`min-h-0 ${activeId ? 'block' : 'hidden lg:block'}`}>
        {activeId ? (
          <ChatPanel
            key={activeId}
            conversationId={activeId}
            summary={activeSummary}
            userId={user?._id}
            onBack={() => select('')}
            onSent={handleSent}
            onRead={handleRead}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
              <MessageCircle className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-medium">Chọn một hội thoại</p>
            <p className="mt-1 text-sm text-muted">Tin nhắn sẽ hiển thị tại đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage({ embedded = false }) {
  if (embedded) {
    return <MessagesContent embedded />;
  }
  return (
    <AccountShell title="Tin nhắn" description="Trao đổi trực tiếp với chủ phòng hoặc khách hàng.">
      <MessagesContent />
    </AccountShell>
  );
}
