export type Disposable = { dispose: () => void; };

function disposable(dispose: () => void): Disposable {
  return { dispose };
}

export type EventListener<T> = (data: T) => void;
export type Event<T> = (listener: EventListener<T>) => Disposable;

export class Emitter<T> {

  private listeners: EventListener<T>[] = [];

  private _event(listener: EventListener<T>): Disposable {
    this.listeners.push(listener);

    return disposable(() => {
      const idx = this.listeners.indexOf(listener);
      this.listeners.splice(idx);
    });
  }

  get event(): Event<T> {
    return this._event.bind(this);
  }

  fire(data?: T): void {
    this.listeners.forEach(listener => listener(data));
  }
}