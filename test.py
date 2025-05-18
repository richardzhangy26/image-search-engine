import qrcode

# 1. 准备你的图片的直接 URL
#    确保这个 URL 在浏览器中打开时直接显示图片！
image_url = "https://cbu01.alicdn.com/img/ibank/O1CN01g93GQ01WBYAmyaPJ1_!!2218614972750-0-cib.jpg" # 替换成你真实的图片 URL

print(f"将要编码的图片 URL: {image_url}")

# 2. 生成二维码
qr = qrcode.QRCode(
    version=None, # 自动选择版本大小
    error_correction=qrcode.constants.ERROR_CORRECT_L, # 纠错级别 L, M, Q, H
    box_size=10, # 每个码点的像素大小
    border=4, # 边框宽度
)
# 只添加图片 URL 作为数据
qr.add_data(image_url)
qr.make(fit=True)

# 3. 创建并保存二维码图片
img = qr.make_image(fill_color="black", back_color="white")
img_filename = "direct_image_link_qrcode.png"
img.save(img_filename)

print(f"包含直接图片链接的二维码已生成: {img_filename}")
print(f"请确图片能在浏览器通过此链接访问: {image_url}")