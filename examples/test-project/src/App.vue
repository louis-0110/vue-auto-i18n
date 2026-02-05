<template>
  <div class="container">
    <header>
      <h1>欢迎使用 Vue Auto I18n</h1>
      <p>这是一个零侵入性的国际化解决方案</p>
    </header>

    <main>
      <section class="features">
        <h2>功能特性</h2>
        <ul>
          <li>特性1：自动中文提取</li>
          <li>特性2：AI 智能翻译</li>
          <li>特性3：零侵入性</li>
        </ul>
      </section>

      <section class="actions">
        <button>按钮</button>
        <button>提交</button>
        <button>取消</button>
      </section>

      <section class="status">
        <h3>状态</h3>
        <p>成功消息</p>
        <p>错误消息</p>
      </section>
    </main>

    <footer>
      <p>页脚信息</p>
      <p>版权所有</p>
      <p>联系我们</p>
      <p>帮助中心</p>
      <p>用户协议</p>
      <p>隐私政策</p>
    </footer>
  </div>
</template>

<script setup>
// 测试脚本中的中文
const title = '标题'
const description = '描述'
const buttonText = '点击按钮'

const handleClick = () => {
  console.log('点击事件')
}
</script>

<style scoped>
.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
}

header {
    text-align: center;
    margin-bottom: 40px;
}

.features {
    margin-bottom: 30px;
}

.features ul {
    list-style: none;
    padding: 0;
}

.features li {
    padding: 10px 0;
    border-bottom: 1px solid #eee;
}

.actions {
    margin-bottom: 30px;
}

.actions button {
    margin-right: 10px;
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
}

.status {
    background: #f5f5f5;
    padding: 20px;
    border-radius: 8px;
}

footer {
    margin-top: 40px;
    text-align: center;
    color: #666;
}
</style>
