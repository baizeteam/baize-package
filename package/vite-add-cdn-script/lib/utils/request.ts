import https from "https";
import http from "http";

const req = {
  //get请求封装
  get: (link: string | URL | https.RequestOptions, callback?: (html: string) => void, fail?: (e: any) => void) => {
    return new Promise<string>((resolve, reject) => {
      try {
        https
          .get(link, (req: http.IncomingMessage) => {
            let html = "";
            req.on("data", (data) => {
              html += data;
            });
            req.on("end", () => {
              callback?.(html);
              resolve(html);
            });
          })
          .on("error", function (error) {
            fail?.(error);
            reject(error);
          });
      } catch (error) {
        fail?.(error);
        reject(error);
      }
    });
  },
};

export default req;
