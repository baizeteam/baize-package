/**
 * 生成加载外部脚本的 HTML 脚本标记字符串，并在加载失败时自动尝试下一个 URL
 * @param urlListRes 包含 URL 和键值的对象数组
 * @param packNameUrl 包含键和 URL 数组的对象
 * @return <script> 标签和错误处理脚本组成字符串
 */

export function generateScript(urlListRes: { urls: string[]; key: string }[]): string {
  let script = "";
  const packNameUrl: { [k in string]?: string[] } = {};
  urlListRes.forEach((element) => {
    if (!element) return;
    const { urls, key } = element;

    packNameUrl[key] = urls;
    const url = urls[0];
    script += `<script src="${url}" type="text/javascript" crossorigin="anonymous" onerror="errorCDN(this)" data-cur="0"  data-key="${key}"></script>\n`;
  });
  const errorScript = `<script>
    function errorCDN(e) {
      const packNameUrl = JSON.parse('${JSON.stringify(packNameUrl)}');
      const nextCur = parseInt(e.getAttribute("data-cur")) + 1;
      const key = e.getAttribute("data-key");
      const curPackNameUrl = packNameUrl[key]
      if(nextCur>=curPackNameUrl.length){return;}
      // 新的cdn链接
      const url = curPackNameUrl[nextCur]
      // 克隆原标签
      const tagName = e.tagName
      const cdnDOM = document.createElement(tagName);
      cdnDOM.setAttribute(tagName === 'SCRIPT' ?'src' : 'href', url);
      Object.keys(e.dataset).forEach(_key => {
        cdnDOM.setAttribute('data-'+_key, e.dataset[_key]);
      })
      cdnDOM.setAttribute("data-cur", nextCur.toString());
      cdnDOM.setAttribute("onerror", "errorCDN(this)");
      document.head.appendChild(cdnDOM);
      e.remove();
    }
  </script>`.replace(/^\s*\/\/.*?$/gm, ""); //去除注释
  script = errorScript + script;
  return script;
}
