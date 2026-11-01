import Notification from '../../models/Notification.js';
import Conversation from '../../models/Conversation.js';
import Message from '../../models/Message.js';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const ago = (ms) => new Date(Date.now() - ms);

const roomOf = (rooms, ownerId) =>
  rooms.find((room) => String(room.owner) === String(ownerId) && room.status === 'approved') ||
  rooms.find((room) => String(room.owner) === String(ownerId)) ||
  null;

const CONVERSATION_SCRIPTS = [
  {
    customer: 'customer1',
    owner: 'owner1',
    startedAgo: 3 * DAY,
    lines: [
      ['customer', 'Chào anh, phòng còn trống cuối tuần này không ạ? Nhà em có 2 người lớn và 1 bé 5 tuổi.'],
      ['owner', 'Chào bạn, cuối tuần này phòng vẫn còn trống nhé. Bé 5 tuổi được ở miễn phí, nhà mình có sẵn nệm phụ.'],
      ['customer', 'Dạ tuyệt quá. Homestay có chỗ đậu ô tô không anh?'],
      ['owner', 'Có bạn nhé, sân trước để được 2 xe 7 chỗ. Bạn đến sau 14h là nhận phòng được.'],
      ['customer', 'Em cảm ơn anh, em đặt luôn ạ.'],
    ],
    unreadFor: 'owner',
  },
  {
    customer: 'customer2',
    owner: 'owner1',
    startedAgo: 26 * HOUR,
    lines: [
      ['customer', 'Chị ơi, em muốn hỏi homestay có cho thuê xe máy không ạ?'],
      ['owner', 'Có em nhé, xe số 120.000đ một ngày, xe ga 150.000đ một ngày, đã gồm mũ bảo hiểm.'],
      ['customer', 'Vậy em đặt 1 xe ga cho 2 ngày, nhận phòng hôm thứ Sáu nha chị.'],
    ],
    unreadFor: 'owner',
  },
  {
    customer: 'customer1',
    owner: 'owner2',
    startedAgo: 6 * DAY,
    lines: [
      ['customer', 'Chào chị, từ homestay ra phố cổ đi bộ mất bao lâu ạ?'],
      ['owner', 'Chào em, đi bộ khoảng 10 phút thôi. Nhà chị có sẵn xe đạp miễn phí cho khách nữa.'],
      ['customer', 'Dạ hay quá. Buổi sáng có phục vụ bữa sáng không chị?'],
      ['owner', 'Có em, bữa sáng gồm cao lầu hoặc bánh mì Hội An, phục vụ từ 7h đến 9h30 nhé.'],
    ],
    unreadFor: 'customer',
  },
];

const seedConversations = async ({ userMap, rooms }) => {
  let conversationCount = 0;
  let messageCount = 0;
  for (const script of CONVERSATION_SCRIPTS) {
    const customer = userMap[script.customer];
    const owner = userMap[script.owner];
    if (!customer || !owner) continue;
    const room = roomOf(rooms, owner._id);
    const step = Math.floor(script.startedAgo / (script.lines.length + 1));
    const conversation = await Conversation.create({
      participants: [customer._id, owner._id],
      room: room?._id || null,
      lastMessageAt: ago(script.startedAgo),
    });
    const docs = script.lines.map(([who, content], index) => {
      const createdAt = ago(script.startedAgo - step * (index + 1));
      const isLast = index === script.lines.length - 1;
      const senderIsCustomer = who === 'customer';
      const recipientRole = senderIsCustomer ? 'owner' : 'customer';
      const unreadForRecipient = isLast && recipientRole === script.unreadFor;
      return {
        conversation: conversation._id,
        sender: senderIsCustomer ? customer._id : owner._id,
        content,
        readAt: unreadForRecipient ? null : new Date(createdAt.getTime() + 5 * MINUTE),
        createdAt,
        updatedAt: createdAt,
      };
    });
    await Message.insertMany(docs, { timestamps: false });
    const last = docs[docs.length - 1];
    const unreadUser = script.unreadFor === 'owner' ? owner._id : customer._id;
    conversation.lastMessage = last.content;
    conversation.lastMessageAt = last.createdAt;
    conversation.unread = new Map([
      [String(customer._id), script.unreadFor === 'customer' ? 1 : 0],
      [String(owner._id), script.unreadFor === 'owner' ? 1 : 0],
    ]);
    await conversation.save();
    await Notification.create({
      user: unreadUser,
      type: 'message',
      title: `Tin nhắn mới từ ${script.unreadFor === 'owner' ? customer.name : owner.name}`,
      message: last.content,
      link: `${script.unreadFor === 'owner' ? '/owner/messages' : '/account/messages'}?c=${conversation._id}`,
      isRead: false,
      createdAt: last.createdAt,
      updatedAt: last.createdAt,
    });
    conversationCount += 1;
    messageCount += docs.length;
  }
  return { conversationCount, messageCount };
};

const buildNotifications = ({ userMap, rooms, bookings }) => {
  const customer1 = userMap.customer1;
  const owner1 = userMap.owner1;
  const admin = userMap.admin;
  const customerBooking = bookings.find((b) => String(b.customer) === String(customer1?._id)) || bookings[0];
  const ownerBooking = bookings.find((b) => String(b.owner) === String(owner1?._id)) || bookings[0];
  const ownerRoom = roomOf(rooms, owner1?._id);
  const pendingRooms = rooms.filter((room) => room.status === 'pending');
  const items = [];
  if (customer1) {
    items.push(
      {
        user: customer1._id,
        type: 'booking_status',
        title: 'Đơn đặt phòng đã được xác nhận',
        message: `Đơn ${customerBooking?.code || ''} đã được chủ phòng xác nhận. Chúc bạn có chuyến đi vui vẻ.`,
        link: customerBooking ? `/account/bookings/${customerBooking._id}` : '/account/bookings',
        isRead: false,
        createdAt: ago(2 * HOUR),
      },
      {
        user: customer1._id,
        type: 'promotion',
        title: 'Ưu đãi mùa hè đã có mặt',
        message: 'Nhập mã CHAOHE10 để được giảm 10% cho đơn đặt phòng, tối đa 300.000đ.',
        link: '/promotions',
        isRead: false,
        createdAt: ago(1 * DAY),
      },
      {
        user: customer1._id,
        type: 'review_reply',
        title: 'Chủ phòng đã phản hồi đánh giá của bạn',
        message: 'Cảm ơn bạn đã ghé thăm, hẹn gặp lại bạn vào mùa hoa dã quỳ nhé.',
        link: '/account/bookings',
        isRead: true,
        createdAt: ago(4 * DAY),
      },
      {
        user: customer1._id,
        type: 'system',
        title: 'Chào mừng bạn đến với HomestayGo',
        message: 'Khám phá hàng trăm homestay đẹp và đặt phòng chỉ trong vài bước.',
        link: '/rooms',
        isRead: true,
        createdAt: ago(30 * DAY),
      }
    );
  }
  if (owner1) {
    items.push(
      {
        user: owner1._id,
        type: 'booking_new',
        title: 'Có đơn đặt phòng mới',
        message: `Đơn ${ownerBooking?.code || ''} vừa được tạo, vui lòng xác nhận sớm.`,
        link: '/owner/bookings',
        isRead: false,
        createdAt: ago(3 * HOUR),
      },
      {
        user: owner1._id,
        type: 'review_new',
        title: 'Có đánh giá mới',
        message: 'Một khách hàng vừa đánh giá 5 sao cho phòng của bạn.',
        link: '/owner/reviews',
        isRead: false,
        createdAt: ago(20 * HOUR),
      },
      {
        user: owner1._id,
        type: 'room_status',
        title: 'Phòng đã được duyệt',
        message: `Phòng "${ownerRoom?.title || 'của bạn'}" đã được duyệt và hiển thị công khai.`,
        link: '/owner/rooms',
        isRead: true,
        createdAt: ago(10 * DAY),
      }
    );
  }
  if (admin) {
    items.push(
      {
        user: admin._id,
        type: 'room_pending',
        title: 'Có phòng mới chờ duyệt',
        message: `Hiện có ${pendingRooms.length} phòng đang chờ duyệt.`,
        link: '/admin/rooms',
        isRead: false,
        createdAt: ago(5 * HOUR),
      },
      {
        user: admin._id,
        type: 'system',
        title: 'Báo cáo tháng đã sẵn sàng',
        message: 'Thống kê doanh thu và lượt đặt phòng tháng trước đã được cập nhật.',
        link: '/admin',
        isRead: true,
        createdAt: ago(3 * DAY),
      }
    );
  }
  return items.map((item) => ({ ...item, updatedAt: item.createdAt }));
};

export const seedCommunication = async (ctx) => {
  await Promise.all([Notification.deleteMany({}), Conversation.deleteMany({}), Message.deleteMany({})]);
  const { conversationCount, messageCount } = await seedConversations(ctx);
  const notifications = buildNotifications(ctx);
  await Notification.insertMany(notifications, { timestamps: false });
  console.log(`Đã tạo ${conversationCount} hội thoại, ${messageCount} tin nhắn, ${notifications.length + conversationCount} thông báo`);
};
