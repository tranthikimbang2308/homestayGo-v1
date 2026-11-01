import dayjs from 'dayjs';
import Setting from '../../models/Setting.js';
import Post from '../../models/Post.js';
import Contact from '../../models/Contact.js';
import Report from '../../models/Report.js';
import Review from '../../models/Review.js';

const unsplash = (id) => `https://images.unsplash.com/photo-${id}?w=1600&q=80`;

const POSTS = [
  {
    title: 'Đà Lạt 3 ngày 2 đêm: lịch trình săn mây, cà phê và chợ đêm',
    category: 'diem-den',
    cover: '1506905925346-21bda4d32df4',
    tags: ['Đà Lạt', 'săn mây', 'lịch trình'],
    excerpt: 'Gợi ý lịch trình Đà Lạt 3 ngày 2 đêm vừa đủ chậm để tận hưởng: săn mây lúc bình minh, cà phê đồi thông, chợ đêm và những homestay giữa rừng.',
    content: `Đà Lạt luôn có cách khiến người ta quay lại: không khí se lạnh quanh năm, những con dốc quanh co và nhịp sống chậm hiếm thấy ở thành phố. Với 3 ngày 2 đêm, bạn hoàn toàn có thể đi đủ những điểm đáng nhớ mà không phải chạy lịch quá dày.

## Ngày 1: Làm quen phố núi

Nhận phòng homestay từ trưa, nghỉ ngơi rồi dạo quanh hồ Xuân Hương vào buổi chiều. Ghé Quảng trường Lâm Viên, sau đó lên chợ Đà Lạt khi trời sẩm tối. Đừng bỏ qua bánh tráng nướng, sữa đậu nành nóng và xiên que nướng ở khu vực cầu thang chợ.

Nếu ở homestay vùng ven như Trại Mát hay Tà Nung, hãy về sớm vì đường đèo buổi tối khá tối và sương mù dày.

## Ngày 2: Săn mây và cà phê đồi thông

Dậy từ 4 giờ 30 sáng để kịp có mặt ở các đồi săn mây phía Cầu Đất hoặc đồi Đa Phú trước 5 giờ 30. Mùa mây đẹp nhất thường từ tháng 9 đến tháng 12, khi đêm trước có mưa nhẹ và sáng hôm sau trời quang.

Buổi trưa về trung tâm ăn bánh căn, lẩu gà lá é. Chiều ghé một quán cà phê view đồi thông, đọc sách hoặc ngủ một giấc ngắn. Buổi tối có thể thử nướng BBQ ngay tại homestay, nhiều nơi cho mượn bếp và chuẩn bị than sẵn.

## Ngày 3: Vườn dâu và mua đặc sản

Buổi sáng tham quan một vườn dâu tây hoặc vườn hoa cẩm tú cầu, sau đó mua mứt, atiso, cà phê Cầu Đất làm quà. Trả phòng trước 12 giờ và thong thả ra sân bay Liên Khương hoặc bến xe.

## Mẹo nhỏ khi đặt homestay ở Đà Lạt

Hỏi chủ nhà về đường vào homestay nếu bạn đi ô tô, vì nhiều con hẻm dốc và hẹp. Mang theo áo khoác dày, tất và kem dưỡng ẩm. Cuối tuần và lễ Tết giá phòng thường cao hơn, nên đặt sớm ít nhất 2 tuần để có lựa chọn tốt.`,
  },
  {
    title: 'Đà Nẵng và Hội An: cung đường di sản cho chuyến đi 4 ngày',
    category: 'diem-den',
    cover: '1559592413-7cec4d0cae2b',
    tags: ['Đà Nẵng', 'Hội An', 'miền Trung'],
    excerpt: 'Kết hợp biển Đà Nẵng, Bà Nà và phố cổ Hội An trong một chuyến đi: nên ở đâu, đi lúc nào và ăn gì để không bỏ lỡ.',
    content: `Đà Nẵng và Hội An chỉ cách nhau khoảng 30 km, đủ gần để gộp chung trong một hành trình nhưng lại mang hai không khí hoàn toàn khác: một bên là thành phố biển hiện đại, một bên là phố cổ trầm mặc bên sông Hoài.

## Nên ở Đà Nẵng hay Hội An?

Cách hợp lý nhất là chia đôi: 2 đêm đầu ở Đà Nẵng gần biển Mỹ Khê để tắm biển và lên Bà Nà, 2 đêm sau chuyển vào Hội An ở các homestay vùng ven như Cẩm Thanh, Cẩm Hà. Ở ngoài phố cổ một chút giúp bạn có không gian yên tĩnh, giá tốt và dễ thuê xe đạp vào trung tâm.

## Những trải nghiệm nên thử

Lên Bà Nà vào buổi sáng sớm để đi Cầu Vàng khi còn vắng người. Buổi chiều tắm biển, tối ăn hải sản ở khu vực Sơn Trà. Tại Hội An, dạo phố cổ lúc hoàng hôn, thả hoa đăng trên sông Hoài và đạp xe qua rừng dừa Bảy Mẫu, ruộng rau Trà Quế.

## Ăn gì?

Đà Nẵng có mì Quảng, bánh tráng cuốn thịt heo, bún chả cá. Hội An nổi tiếng với cao lầu, cơm gà, bánh mì và chè bắp. Nên ăn ở các quán địa phương đông khách thay vì những nơi treo bảng giá bằng ngoại tệ.

## Thời điểm đẹp nhất

Từ tháng 2 đến tháng 8 trời nắng, biển đẹp. Từ tháng 9 đến tháng 12 là mùa mưa bão, phố cổ có thể ngập. Nếu đi vào thời gian này, hãy chọn chính sách hủy linh hoạt và theo dõi dự báo thời tiết trước ngày đi.`,
  },
  {
    title: 'Mùa lúa chín Tây Bắc: kinh nghiệm đi Sa Pa và Mù Cang Chải',
    category: 'diem-den',
    cover: '1570366583862-f91883984fde',
    tags: ['Sa Pa', 'Mù Cang Chải', 'ruộng bậc thang'],
    excerpt: 'Tháng 9 là lúc ruộng bậc thang Tây Bắc chuyển vàng. Những điều cần biết về thời điểm, phương tiện và chỗ ở để có chuyến đi trọn vẹn.',
    content: `Ruộng bậc thang mùa lúa chín là một trong những khung cảnh đẹp nhất Việt Nam. Mỗi năm chỉ có khoảng vài tuần để ngắm trọn sắc vàng, vì vậy chuẩn bị kỹ sẽ giúp bạn không bị lỡ hẹn.

## Thời điểm lúa chín

Mù Cang Chải thường chín sớm hơn, khoảng giữa tháng 9 đến đầu tháng 10. Sa Pa, Y Tý muộn hơn một chút. Lúa chín không đồng đều giữa các thung lũng, nên hãy hỏi chủ homestay địa phương tình hình thực tế trước khi đi vài ngày.

## Di chuyển

Từ Hà Nội có thể đi xe giường nằm đến Sa Pa khoảng 5 đến 6 tiếng qua cao tốc. Nếu muốn kết hợp Mù Cang Chải, nên đi theo cung Hà Nội - Nghĩa Lộ - Tú Lệ - Mù Cang Chải - Than Uyên - Sa Pa. Đèo Khau Phạ khá dài và dốc, chỉ nên tự lái xe máy nếu bạn có kinh nghiệm đi đèo.

## Chọn chỗ ở

Homestay nhà sàn ở bản Cát Cát, Tả Van (Sa Pa) hoặc La Pán Tẩn (Mù Cang Chải) giúp bạn thức dậy giữa ruộng lúa và trải nghiệm bữa cơm cùng gia đình người Mông, người Dao. Ban đêm vùng cao khá lạnh, hãy kiểm tra homestay có chăn ấm và nước nóng.

## Lưu ý tôn trọng văn hóa bản địa

Xin phép trước khi chụp ảnh người dân, không đi tắt qua bờ ruộng làm đổ lúa, không cho trẻ em kẹo hay tiền. Mua đồ thủ công trực tiếp từ người làm là cách ủng hộ cộng đồng thiết thực nhất.`,
  },
  {
    title: 'Ninh Bình một ngày: Tràng An, Hang Múa và Tam Cốc',
    category: 'diem-den',
    cover: '1531737212413-667205e1cda7',
    tags: ['Ninh Bình', 'Tràng An', 'Hang Múa'],
    excerpt: 'Chỉ cách Hà Nội khoảng 100 km, Ninh Bình là lựa chọn tuyệt vời cho chuyến đi ngắn. Lịch trình gợi ý và mẹo tránh đông.',
    content: `Ninh Bình được ví như "Hạ Long trên cạn" với những dãy núi đá vôi soi bóng xuống sông và cánh đồng lúa. Bạn có thể đi trong ngày từ Hà Nội, nhưng ở lại một đêm ở homestay sẽ trọn vẹn hơn nhiều.

## Buổi sáng: đi thuyền Tràng An

Có mặt ở bến thuyền Tràng An từ 7 giờ để tránh nắng và đoàn khách lớn. Hành trình thuyền khoảng 2 đến 3 tiếng, đi qua nhiều hang động và đền cổ. Nên mang mũ, nước uống và kem chống nắng.

## Buổi trưa: thưởng thức đặc sản

Dê núi và cơm cháy là hai món không thể bỏ qua. Các quán ở khu vực Tam Cốc thường có thực đơn rõ giá, nên hỏi trước khi gọi món.

## Buổi chiều: leo Hang Múa

Khoảng 500 bậc đá dẫn lên đỉnh núi nơi có tượng rồng uốn lượn. Từ trên cao nhìn xuống là toàn cảnh sông Ngô Đồng và cánh đồng Tam Cốc. Thời điểm đẹp nhất là cuối tháng 5 đến đầu tháng 6 khi lúa chín vàng.

## Nghỉ đêm ở homestay

Các homestay quanh Tam Cốc thường có hồ bơi nhỏ, xe đạp miễn phí và tầm nhìn ra núi. Buổi tối đạp xe dọc đường làng, sáng hôm sau dậy sớm ngắm sương trên cánh đồng trước khi trở về Hà Nội.`,
  },
  {
    title: '10 điều cần kiểm tra trước khi đặt homestay',
    category: 'kinh-nghiem',
    cover: '1488646953014-85cb44e25828',
    tags: ['đặt phòng', 'homestay', 'mẹo hay'],
    excerpt: 'Ảnh đẹp chưa đủ để có một kỳ nghỉ ưng ý. Danh sách 10 điều nên kiểm tra giúp bạn chọn đúng homestay và tránh phát sinh không mong muốn.',
    content: `Homestay mang lại cảm giác gần gũi như ở nhà, nhưng mỗi nơi có tiêu chuẩn khác nhau. Dành vài phút kiểm tra những điểm dưới đây sẽ giúp chuyến đi suôn sẻ hơn rất nhiều.

## Về thông tin phòng

1. Đọc kỹ mô tả và xem toàn bộ ảnh, đặc biệt là ảnh phòng tắm và lối đi.
2. Kiểm tra số khách tối đa, số giường và loại giường để biết cả đoàn có đủ chỗ ngủ không.
3. Xem bản đồ vị trí: khoảng cách tới trung tâm, chợ, bãi biển và đường vào có đi được ô tô không.
4. Kiểm tra tiện nghi quan trọng với bạn như điều hòa, nước nóng, bếp, chỗ đậu xe.

## Về giá và chính sách

5. Xem tổng tiền cuối cùng gồm phí dọn dẹp và phí dịch vụ, không chỉ giá mỗi đêm.
6. Lưu ý giá cuối tuần và số đêm tối thiểu, nhiều homestay áp dụng giá khác vào thứ 6 và thứ 7.
7. Đọc chính sách hủy phòng và thời hạn hoàn tiền.
8. Kiểm tra mã giảm giá đang có trên trang Ưu đãi trước khi thanh toán.

## Về chủ nhà và đánh giá

9. Đọc các đánh giá gần đây, chú ý những nhận xét về vệ sinh, độ chính xác của ảnh và thái độ chủ nhà.
10. Nhắn tin hỏi chủ nhà những điều chưa rõ trước khi đặt. Cách chủ nhà phản hồi cũng cho bạn biết nhiều về chất lượng phục vụ.

Nếu phát hiện thông tin sai sự thật hoặc dấu hiệu bất thường, hãy dùng nút "Báo cáo" trên trang phòng để đội ngũ HomestayGo kiểm tra kịp thời.`,
  },
  {
    title: 'Ngủ một đêm gần vịnh Hạ Long: nên chọn du thuyền hay homestay?',
    category: 'kinh-nghiem',
    cover: '1528127269322-539801943592',
    tags: ['Hạ Long', 'Quảng Ninh', 'so sánh'],
    excerpt: 'So sánh ưu nhược điểm giữa ngủ đêm trên du thuyền và ở homestay ven vịnh để bạn chọn được phương án phù hợp ngân sách và sở thích.',
    content: `Vịnh Hạ Long là di sản thiên nhiên thế giới và là điểm đến không thể thiếu khi đi miền Bắc. Câu hỏi nhiều người băn khoăn là nên ngủ trên du thuyền hay chọn một homestay trên bờ.

## Du thuyền ngủ đêm

Ưu điểm lớn nhất là được ngắm hoàng hôn và bình minh ngay giữa vịnh, lịch trình trọn gói gồm chèo kayak, thăm hang và bữa ăn hải sản. Nhược điểm là chi phí cao, thời gian tự do ít và có thể say sóng nếu thời tiết xấu.

## Homestay ven vịnh

Các homestay ở Bãi Cháy, Hùng Thắng hay đảo Cát Bà, Quan Lạn có giá mềm hơn nhiều, phù hợp nhóm bạn hoặc gia đình đông người. Bạn có thể chủ động lịch trình, đi tour thuyền trong ngày rồi về nghỉ, buổi tối đi chợ đêm hay tự nấu ăn.

## Gợi ý kết hợp

Nếu có 3 ngày, hãy ở homestay 2 đêm và dành một ngày đi tour thuyền 6 tiếng qua hang Sửng Sốt, đảo Ti Tốp. Cách này vừa tiết kiệm vừa vẫn được trải nghiệm vịnh trọn vẹn.

## Thời điểm nên tránh

Từ tháng 7 đến tháng 9 là mùa mưa bão, tàu có thể bị cấm ra khơi. Hãy chọn homestay có chính sách hủy linh hoạt và theo dõi thông báo của cảng trước ngày đi.`,
  },
  {
    title: 'Ăn sáng kiểu Hà Nội: phở, bún chả và những gánh hàng rong',
    category: 'am-thuc',
    cover: '1582878826629-29b7ad1cdc43',
    tags: ['Hà Nội', 'phở', 'ẩm thực đường phố'],
    excerpt: 'Bữa sáng là lúc Hà Nội ngon nhất. Gợi ý những món nên thử, cách ăn đúng điệu và vài lưu ý để không bị "chặt chém".',
    content: `Người Hà Nội ăn sáng rất sớm và rất kỹ. Một bát phở nóng, một suất xôi hay bát bún thang đủ làm nên khởi đầu trọn vẹn cho ngày khám phá phố cổ.

## Phở bò và phở gà

Phở Hà Nội nước trong, ngọt thanh từ xương, bánh phở mềm. Phở bò có tái, chín, nạm, gầu; phở gà thơm mùi lá chanh. Người Hà Nội ít cho tương đen, chủ yếu thêm chút giấm tỏi, ớt tươi và quẩy.

## Bún chả

Bún chả thường bán từ trưa nhưng nhiều hàng mở từ sáng. Chả viên và chả miếng nướng than hoa, ăn kèm nước mắm pha chua ngọt, đu đủ xanh và rau sống. Nên gọi thêm nem cua bể nếu đi theo nhóm.

## Xôi, bánh cuốn và bún thang

Xôi xéo với hành phi, bánh cuốn Thanh Trì mỏng như lụa, bún thang nhiều màu sắc là những món nhẹ bụng, hợp với ngày se lạnh.

## Mẹo nhỏ

Ăn ở các quán đông người địa phương, hỏi giá trước khi gọi ở hàng rong khu phố cổ. Nếu ở homestay trong phố, hãy hỏi chủ nhà, họ luôn có danh sách quán ruột mà không cuốn cẩm nang nào ghi lại.`,
  },
  {
    title: 'Khám phá ẩm thực Sài Gòn về đêm',
    category: 'am-thuc',
    cover: '1504674900247-0877df9cc836',
    tags: ['Sài Gòn', 'ăn đêm', 'ẩm thực'],
    excerpt: 'Sài Gòn không ngủ và các quán ăn cũng vậy. Hành trình ăn đêm qua những món đặc trưng từ ốc, bột chiên đến chè và bánh mì.',
    content: `Khi nắng tắt, Sài Gòn mới thực sự bắt đầu một nhịp sống khác: vỉa hè đông đúc, mùi thơm từ những bếp than và tiếng trò chuyện rộn ràng đến khuya.

## Ốc và hải sản vỉa hè

Ốc là "đặc sản" ăn đêm của người Sài Gòn: ốc hương rang muối ớt, sò điệp nướng mỡ hành, nghêu hấp sả. Khu vực Quận 4 và Quận 8 có nhiều quán ngon, giá hợp lý.

## Bột chiên, phá lấu và bánh tráng nướng

Bột chiên giòn bên ngoài, mềm bên trong, ăn kèm đu đủ ngâm chua. Phá lấu nước cốt dừa béo ngậy chấm bánh mì. Bánh tráng nướng tuy xuất xứ Đà Lạt nhưng đã trở thành món quen thuộc của giới trẻ Sài Gòn.

## Kết thúc bằng chè và bánh mì

Một ly chè Thái, chè bưởi hay sữa đậu nành nóng là món tráng miệng hoàn hảo. Nếu còn sức, hãy thử một ổ bánh mì nóng giòn lúc nửa đêm.

## Lưu ý khi đi ăn đêm

Giữ đồ cá nhân cẩn thận, đặc biệt điện thoại khi ngồi sát lề đường. Nên đi bằng xe công nghệ và chọn homestay ở khu vực trung tâm để thuận tiện quay về.`,
  },
  {
    title: 'Đi du lịch cùng trẻ nhỏ: chuẩn bị gì và chọn homestay ra sao?',
    category: 'kinh-nghiem',
    cover: '1578645510447-e20b4311e3ce',
    tags: ['gia đình', 'trẻ em', 'kinh nghiệm'],
    excerpt: 'Đi chơi cùng con nhỏ cần chuẩn bị nhiều hơn một chút. Những gợi ý thực tế để cả nhà có chuyến đi vui vẻ và an toàn.',
    content: `Du lịch cùng trẻ nhỏ là cơ hội tuyệt vời để gắn kết gia đình, nhưng cũng đòi hỏi kế hoạch kỹ hơn. Chọn đúng chỗ ở là một nửa thành công.

## Tiêu chí chọn homestay cho gia đình

Ưu tiên nhà nguyên căn hoặc phòng có bếp để chủ động nấu ăn cho bé. Kiểm tra cầu thang, ban công có lan can an toàn và hồ bơi có rào chắn. Sân vườn rộng sẽ là "sân chơi" lý tưởng cho trẻ.

## Đồ dùng nên mang theo

Thuốc hạ sốt, men tiêu hóa, kem chống muỗi, nhiệt kế; quần áo dư ít nhất 2 bộ mỗi ngày; đồ chơi nhỏ gọn và sách tranh. Hỏi trước chủ nhà xem có nôi, ghế ăn dặm hoặc chậu tắm cho bé không.

## Lên lịch trình nhẹ nhàng

Không nên đi quá 2 điểm tham quan mỗi ngày. Giữ giờ ngủ trưa của bé, tránh di chuyển giờ cao điểm và luôn có kế hoạch dự phòng khi trời mưa.

## Ghi chú cho chủ nhà

Khi đặt phòng, hãy ghi rõ số trẻ em và độ tuổi trong phần ghi chú. Nhiều chủ homestay sẵn sàng chuẩn bị thêm gối, chăn mỏng hoặc che chắn ổ điện nếu được báo trước.`,
  },
  {
    title: 'Homestay xanh: xu hướng lưu trú bền vững mùa du lịch cuối năm',
    category: 'tin-tuc',
    cover: '1540611025311-01df3cef54b5',
    tags: ['du lịch bền vững', 'xu hướng', 'homestay xanh'],
    excerpt: 'Ngày càng nhiều du khách ưu tiên những nơi lưu trú thân thiện môi trường. Homestay xanh là gì và bạn có thể góp phần như thế nào?',
    content: `Du lịch bền vững không còn là khái niệm xa lạ. Nhiều chủ homestay đã chủ động thay đổi cách vận hành để giảm rác thải và gắn kết hơn với cộng đồng địa phương.

## Homestay xanh là gì?

Đó là những nơi lưu trú hạn chế đồ nhựa dùng một lần, dùng bình nước thủy tinh, phân loại rác, tận dụng năng lượng mặt trời và ưu tiên nguyên liệu từ nông hộ quanh vùng. Nhiều nơi còn trồng rau sạch để phục vụ bữa sáng cho khách.

## Lợi ích cho du khách

Bạn được ở trong không gian gần gũi thiên nhiên, ăn thực phẩm tươi và có cơ hội tham gia các hoạt động như làm vườn, nấu ăn cùng gia đình chủ nhà. Chi phí thường không cao hơn homestay thông thường.

## Bạn có thể làm gì?

Mang theo bình nước cá nhân, túi vải, hạn chế yêu cầu thay khăn mỗi ngày, tắt điện khi ra ngoài. Khi đánh giá phòng trên HomestayGo, hãy nhắc đến những điểm xanh mà chủ nhà làm được để lan tỏa thói quen tốt.

## HomestayGo đồng hành

Trong thời gian tới, HomestayGo sẽ tiếp tục giới thiệu các homestay có cách vận hành thân thiện môi trường trên chuyên mục Cẩm nang, giúp du khách dễ dàng lựa chọn những chuyến đi có trách nhiệm hơn.`,
  },
];

const CONTACTS = [
  { name: 'Lý Thị Hồng', email: 'lyhong.travel@example.com', phone: '0905123456', subject: 'Hỏi về thanh toán VNPay', message: 'Chào HomestayGo, mình thanh toán qua VNPay nhưng tài khoản đã bị trừ tiền mà đơn vẫn hiện chưa thanh toán. Nhờ đội ngũ kiểm tra giúp mình với.', status: 'new', daysAgo: 1 },
  { name: 'Trần Văn Nam', email: 'namtran.host@example.com', phone: '0918765432', subject: 'Muốn trở thành chủ phòng', message: 'Tôi có một căn nhà vườn ở Bảo Lộc muốn đăng cho thuê trên HomestayGo. Xin hướng dẫn thủ tục và mức phí dành cho chủ phòng.', status: 'new', daysAgo: 2 },
  { name: 'Nguyễn Thảo Vy', email: 'thaovy.nguyen@example.com', phone: '', subject: 'Góp ý giao diện', message: 'Trang web dễ dùng, nhưng mình mong có thêm bộ lọc theo khoảng cách tới biển. Cảm ơn đội ngũ đã làm sản phẩm rất tốt.', status: 'replied', reply: 'Cảm ơn bạn Vy đã góp ý. Chúng tôi đã ghi nhận đề xuất bộ lọc theo khoảng cách và sẽ cân nhắc trong các bản cập nhật sắp tới.', daysAgo: 6 },
  { name: 'Phan Đức Long', email: 'longphan@example.com', phone: '0977000111', subject: 'Hủy đơn và hoàn tiền', message: 'Tôi đã hủy đơn đặt phòng trước 5 ngày, xin hỏi bao lâu thì tiền được hoàn về tài khoản ngân hàng?', status: 'replied', reply: 'Chào anh Long, với đơn hủy trước 3 ngày, tiền sẽ được hoàn trong vòng 5 đến 7 ngày làm việc tùy ngân hàng. Anh vui lòng kiểm tra lại và phản hồi nếu chưa nhận được nhé.', daysAgo: 9 },
  { name: 'Đỗ Minh Châu', email: 'chaudo@example.com', phone: '0932456789', subject: 'Hợp tác truyền thông', message: 'Bên mình là một kênh du lịch trên mạng xã hội, muốn hợp tác giới thiệu các homestay trên HomestayGo. Mong nhận được phản hồi.', status: 'closed', daysAgo: 15 },
];

export const seedContent = async (ctx) => {
  const { userMap, rooms } = ctx;
  await Promise.all([Setting.deleteMany({}), Post.deleteMany({}), Contact.deleteMany({}), Report.deleteMany({})]);

  await Setting.create({});

  const now = dayjs();
  for (let i = 0; i < POSTS.length; i += 1) {
    const { cover, ...fields } = POSTS[i];
    const post = await Post.create({
      ...fields,
      coverImage: unsplash(cover),
      author: userMap.admin._id,
      views: 120 + ((i * 137) % 900),
    });
    const createdAt = now.subtract(i * 6 + 1, 'day').hour(9).toDate();
    await Post.collection.updateOne({ _id: post._id }, { $set: { createdAt, updatedAt: createdAt } });
  }

  for (const item of CONTACTS) {
    const { daysAgo, ...fields } = item;
    const createdAt = now.subtract(daysAgo, 'day').toDate();
    const contact = await Contact.create({
      ...fields,
      repliedAt: fields.status === 'replied' ? dayjs(createdAt).add(1, 'day').toDate() : undefined,
      repliedBy: fields.status === 'replied' ? userMap.admin._id : undefined,
    });
    await Contact.collection.updateOne({ _id: contact._id }, { $set: { createdAt, updatedAt: createdAt } });
  }

  const approved = rooms.filter((room) => room.status === 'approved');
  const reportPlan = [
    { room: approved[3], reporter: 'customer1', reason: 'sai_thong_tin', description: 'Ảnh đăng có hồ bơi nhưng khi đến nơi hồ bơi đã ngừng hoạt động từ lâu.', status: 'pending', daysAgo: 2 },
    { room: approved[7], reporter: 'customer2', reason: 've_sinh', description: 'Phòng tắm có mùi ẩm mốc, khăn tắm chưa được thay khi nhận phòng.', status: 'pending', daysAgo: 4 },
    { room: approved[5], reporter: 'customer3', reason: 'thai_do', description: 'Chủ phòng nói chuyện thiếu lịch sự khi tôi hỏi về giờ nhận phòng sớm.', status: 'resolved', adminNote: 'Đã liên hệ và nhắc nhở chủ phòng về thái độ phục vụ.', daysAgo: 12 },
    { room: approved[1], reporter: 'customer4', reason: 'lua_dao', description: 'Nghi ngờ phòng không có thật vì giá quá rẻ so với khu vực.', status: 'rejected', adminNote: 'Đã xác minh phòng hoạt động bình thường, giá thấp do chương trình khuyến mãi của chủ phòng.', daysAgo: 20 },
  ];
  for (const item of reportPlan) {
    if (!item.room) continue;
    const createdAt = now.subtract(item.daysAgo, 'day').toDate();
    const report = await Report.create({
      room: item.room._id,
      reporter: userMap[item.reporter]._id,
      reason: item.reason,
      description: item.description,
      status: item.status,
      adminNote: item.adminNote || '',
      resolvedAt: item.status === 'pending' ? undefined : dayjs(createdAt).add(1, 'day').toDate(),
    });
    await Report.collection.updateOne({ _id: report._id }, { $set: { createdAt, updatedAt: createdAt } });
  }

  const hiddenTargets = await Review.find({ rating: { $lte: 3 } }).sort({ rating: 1, createdAt: -1 }).limit(1);
  const fallback = hiddenTargets.length ? [] : await Review.find().sort({ createdAt: -1 }).limit(1);
  for (const review of [...hiddenTargets, ...fallback]) {
    await Review.updateOne(
      { _id: review._id },
      { $set: { isHidden: true, hiddenReason: 'Nội dung chứa thông tin cá nhân của chủ phòng, vi phạm tiêu chuẩn cộng đồng.', hiddenAt: now.subtract(3, 'day').toDate() } }
    );
    await Review.recalcRoomRating(review.room);
  }

  console.log(`Đã tạo cài đặt, ${POSTS.length} bài viết, ${CONTACTS.length} liên hệ, ${reportPlan.length} khiếu nại, ẩn ${hiddenTargets.length + fallback.length} đánh giá`);
};
