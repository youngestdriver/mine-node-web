一个部署在Cloudflare Workers上管理和查看订阅信息的系统。
# 功能
1. (/manage) 显示管理页面 <br>
2. (/ ) 显示订阅信息

# 如何部署
1. 在Cloudflare Workers中创建一个新的Worker。

2. 在Cloudflare Workers中添加一个KV命名空间并绑定到您的Worker。
  - 在Workers界面中，选择您的Worker
  - 点击"设置"标签
  - 滚动到"变量"部分
  - 在"KV命名空间绑定"下，点击"添加绑定"
  - 选择您创建的KV命名空间，并为绑定命名（例如：SUBSCRIPTIONS）
  - 复制 worker.js 文件的内容到您的Worker。

3. 修改代码开头的以下内容：
```
const KV_NAMESPACE = KV; // 确保 KV 是您在 Cloudflare Workers 设置中绑定的变量名
```
