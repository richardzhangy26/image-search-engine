import numpy as np
from product_search import VectorProductIndex

def test_vector_index():
    # 初始化向量索引
    vector_index = VectorProductIndex()
    
    # 加载向量
    vector_index._load_vectors()
    
    # 获取索引中的统计信息
    ntotal = vector_index.index.ntotal  # 获取索引中的向量总数
    d = vector_index.index.d  # 获取向量维度
    
    print(f"向量索引统计信息:")
    print(f"向量总数: {ntotal}")
    print(f"向量维度: {d}")
    
    # 如果索引中有向量，我们可以查看一些示例
    if ntotal > 0:
        # 获取所有向量
        vectors = vector_index.index.reconstruct_n(0, ntotal)  # 重建所有向量
        print(f"\n前3个向量的形状: {vectors[:3].shape}")
        print(f"\n第一个向量的前10个维度:")
        print(vectors[0][:10])
        
        # 计算一些基本统计信息
        means = np.mean(vectors, axis=0)[:10]
        stds = np.std(vectors, axis=0)[:10]
        print(f"\n向量前10个维度的平均值:")
        print(means)
        print(f"\n向量前10个维度的标准差:")
        print(stds)

if __name__ == "__main__":
    test_vector_index()
