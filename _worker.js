const MY_TOKEN = '123'; // 不再使用,但保留以防将来需要
// @ts-ignore
const KV_NAMESPACE = SUBSCRIPTIONS; // 确保 KV 是您在 Cloudflare Workers 设置中绑定的变量名
const SUBCONVERTER = "back.889876.xyz"; // 后端地址
const SUB_CONFIG = "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online.ini"; // 规则地址

const TARGETS = ['clash', 'sing-box', 'singbox', 'shadowrocket', 'quantumult'];
const SUBTARGET_MAP = new Map([
  ['clash', '/clash'],
  ['sing-box', '/singbox'],
  ['singbox', '/singbox'],
  ['shadowrocket', '/clash'],
  ['quantumult', '/clash']
]);

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  console.log(`Request path: ${path}`);

  switch (path) {
    case '/':
      return handleSubscriptionRequest(request);
    case '/manage':
      return handleManagePage(request);
    case '/saveMainData':
      if (request.method === 'POST') return handleSaveMainData(request);
      break;
    case '/saveUrls':
      if (request.method === 'POST') return handleSaveUrls(request);
      break;
  }

  return new Response('Not Found', { status: 404 });
}

async function handleSubscriptionRequest(request) {
  const userAgent = request.headers.get('User-Agent') || '';
  let mainData = await KV_NAMESPACE.get('MainData') || '';
  let urlsString = await KV_NAMESPACE.get('urls') || 'https://allsub.king361.cf';
  const urls = urlsString.split(',').map(url => url.trim());
  const url = new URL(request.url);

  let allContent = await fetchAllSubscriptions(urls, mainData, userAgent, url);
  return new Response(allContent, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

async function handleManagePage(request) {
  const mainData = await KV_NAMESPACE.get('MainData') || '';
  const urlsString = await KV_NAMESPACE.get('urls') || '';

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>订阅管理系统</title>
    <style>
        :root {
            --primary-color: #3498db;
            --secondary-color: #2ecc71;
            --background-color: #ecf0f1;
            --text-color: #34495e;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--background-color);
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: var(--primary-color);
            text-align: center;
            margin-bottom: 30px;
        }
        .tab-container {
            display: flex;
            margin-bottom: 20px;
        }
        .tab {
            padding: 10px 20px;
            background-color: #f1f1f1;
            border: none;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .tab.active {
            background-color: var(--primary-color);
            color: white;
        }
        .content {
            display: none;
        }
        .content.active {
            display: block;
        }
        textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            resize: vertical;
        }
        button {
            background-color: var(--secondary-color);
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        button:hover {
            background-color: #27ae60;
        }
        .message {
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
        }
        .success {
            background-color: #d4edda;
            color: #155724;
        }
        .error {
            background-color: #f8d7da;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>订阅管理系统</h1>
        <div class="tab-container">
            <button class="tab active" onclick="openTab(event, 'mainDataTab')">自定义节点</button>
            <button class="tab" onclick="openTab(event, 'urlsTab')">订阅链接</button>
        </div>
        <div id="mainDataTab" class="content active">
            <h2>自定义节点</h2>
            <textarea id="mainData" rows="10">${mainData}</textarea>
            <button onclick="saveMainData()">保存自定义节点</button>
            <div id="mainDataMessage" class="message"></div>
        </div>
        <div id="urlsTab" class="content">
            <h2>订阅链接</h2>
            <h3>(用逗号分隔)</h3>
            <textarea id="urls" rows="4">${urlsString}</textarea>
            <button onclick="saveUrls()">保存订阅链接</button>
            <div id="urlsMessage" class="message"></div>
        </div>
    </div>
    <script>
        function openTab(evt, tabName) {
            var i, content, tabs;
            content = document.getElementsByClassName("content");
            for (i = 0; i < content.length; i++) {
                content[i].className = content[i].className.replace(" active", "");
            }
            tabs = document.getElementsByClassName("tab");
            for (i = 0; i < tabs.length; i++) {
                tabs[i].className = tabs[i].className.replace(" active", "");
            }
            document.getElementById(tabName).className += " active";
            evt.currentTarget.className += " active";
        }

        async function saveMainData() {
            const mainData = document.getElementById('mainData').value;
            const response = await fetch('/saveMainData', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mainData }),
            });
            const result = await response.json();
            showMessage('mainDataMessage', result.message, result.success);
        }

        async function saveUrls() {
            const urls = document.getElementById('urls').value;
            const response = await fetch('/saveUrls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls }),
            });
            const result = await response.json();
            showMessage('urlsMessage', result.message, result.success);
        }

        function showMessage(elementId, message, success) {
            const element = document.getElementById(elementId);
            element.textContent = message;
            element.className = 'message ' + (success ? 'success' : 'error');
            setTimeout(() => {
                element.textContent = '';
                element.className = 'message';
            }, 3000);
        }
    </script>
</body>
</html>
  `;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function handleSaveMainData(request) {
  try {
    const { mainData } = await request.json();
    await KV_NAMESPACE.put('MainData', mainData);
    return new Response(JSON.stringify({ success: true, message: '自定义节点保存成功' }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: '自定义节点保存失败' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

async function handleSaveUrls(request) {
  try {
    const { urls } = await request.json();
    await KV_NAMESPACE.put('urls', urls);
    return new Response(JSON.stringify({ success: true, message: '订阅链接保存成功' }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: '订阅链接保存失败' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

async function fetchAllSubscriptions(urls, customNodes, userAgent, url) {
  let req_data = customNodes;
  let SubURL = `${url.origin}`; // 修改这里，移除 MY_TOKEN

  try {
    const responses = await Promise.all(urls.map(url => fetch(url, {
      method: 'get',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;',
        'User-Agent': 'worker/sub/mjjonone'
      }
    })));

    for (const response of responses) {
      if (response.ok) {
        const content = await response.text();
        try {
          req_data += atob(content) + '\n';
        } catch (error) {
          console.error(`Error decoding content: ${error.message}`);
          req_data += content + '\n';
        }
      } else {
        console.error(`Error fetching subscription: ${response.status} ${response.statusText}`);
      }
    }

    return await processSubscriptions(req_data, userAgent, SubURL);
  } catch (error) {
    console.error(`Unexpected error in fetchAllSubscriptions: ${error.message}`);
    throw error;
  }
}

async function processSubscriptions(req_data, userAgent, SubURL) {
  for (const target of TARGETS) {
    if (userAgent.toLowerCase().includes(target)) {
      try {
        return await fetchSubscriptionContent(target, req_data, SUBCONVERTER, SUB_CONFIG, SubURL);
      } catch (error) {
        console.error(`Error with target ${target}: ${error.message}`);
      }
    }
  }
  console.log("User-Agent not matched, returning encoded data");
  return btoa(req_data);
}

async function fetchSubscriptionContent(target, req_data, subConverter, subConfig, SubURL) {
  const subPath = SUBTARGET_MAP.get(target) || '';
  const requestUrl = `https://${subConverter}${subPath}?target=${target}&url=${encodeURIComponent(SubURL)}&config=${subConfig}`;
  
  const response = await fetch(requestUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch subscription content for target ${target}`);
  }

  return await response.text();
}
