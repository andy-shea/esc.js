const handlers = [];

const ProxyHandler = {
  get(target, propKey, receiver) {
    if (propKey === 'hasStoppedImmediatePropagation') {
      return this.hasStoppedImmediatePropagation;
    }

    const prop = target[propKey];
    if (typeof prop === 'function') {
      if (prop.name === 'stopImmediatePropagation') {
        return (...args) => {
          this.hasStoppedImmediatePropagation = true;
          return prop.apply(target, args);
        };
      }
      return prop.bind(target);
    }

    return prop;
  }
};

document.addEventListener('keyup', event => {
  if (event.keyCode === 27) {
    const eventProxy = new Proxy(
      event,
      Object.assign(Object.create(ProxyHandler), {
        hasStoppedImmediatePropagation: false
      })
    );

    for (const {handler} of handlers) {
      handler(eventProxy);
      if (eventProxy.hasStoppedImmediatePropagation) break;
    }
  }
});

function sortHandlers(a, b) {
  if (a.priority === b.priority) return b.date - a.date;
  return b.priority - a.priority;
}

function esc(handler, priority = 0) {
  const entry = {handler, priority, date: Date.now()};
  handlers.push(entry);
  handlers.sort(sortHandlers);
  return () => {
    const index = handlers.indexOf(entry);
    if (index !== -1) handlers.splice(index, 1);
  };
}

export default esc;
