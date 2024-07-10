declare module "*?worker&inline" {
  class WebWorker extends Worker {
    constructor();
  }
  export default WebWorker;
}
