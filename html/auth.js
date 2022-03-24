const authWorker = new Worker("auth.worker.js", { type: "module" });

function post(event) {
  authWorker.postMessage(event);
}

function on(states, fn) {
  const callback = (event) => {
    const { state } = event.data;
    for (const s of states) {
      if (s == state) {
        return fn(event);
      }
    }
  };

  authWorker.addEventListener("message", callback);
  return callback;
}

function off(fn) {
  authWorker.removeEventListener("message", fn);
}

export default {
  post,
  on,
  off,
};
