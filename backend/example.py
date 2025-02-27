from product_search import VectorProductIndex, ProductInfo

def main():
    # 初始化索引系统
    db_path = "data/product_search/db/products.db"
    index = VectorProductIndex(db_path)
    
    # 添加商品示例
    product = ProductInfo(
        product_id="P001",
        name="休闲T恤",
        attributes={
            "color": "白色",
            "size": "L",
            "style": "简约"
        },
        price=99.00,
        description="舒适透气的纯棉T恤"
    )
    
    # 图片路径示例
    image_paths = [
        "data/product_search/images/22171736743520_.pic_neplm0P.jpg"
    ]
    
    # 添加商品和图片
    index.add_product(product, image_paths)
    
    # 保存索引
    index.save_index("data/product_search/index/product_vectors.index")

if __name__ == "__main__":
    main()
