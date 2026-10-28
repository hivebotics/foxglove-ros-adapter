import { describe, expect, it, vi } from "vitest";

import { FoxgloveProtocolClient } from "../src/protocol";

describe("FoxgloveProtocolClient", () => {
  it("uses the configured WebSocket factory", () => {
    const socket = {
      binaryType: "blob",
      close: vi.fn(),
      onclose: null,
      onerror: null,
      onmessage: null,
      onopen: null,
      readyState: 0,
      send: vi.fn()
    } as unknown as WebSocket;
    const webSocketFactory = vi.fn(() => socket);
    const client = new FoxgloveProtocolClient(webSocketFactory);

    client.connect("https://robot.example:3201");

    expect(webSocketFactory).toHaveBeenCalledWith("wss://robot.example:3201", [
      "foxglove.sdk.v1",
      "foxglove.websocket.v1"
    ]);
    expect(socket.binaryType).toBe("arraybuffer");
  });

  it("does not allocate a client channel while disconnected", () => {
    const socket = {
      binaryType: "blob",
      close: vi.fn(),
      onclose: null,
      onerror: null,
      onmessage: null,
      onopen: null,
      readyState: 0,
      send: vi.fn()
    } as unknown as WebSocket;
    const client = new FoxgloveProtocolClient(() => socket);
    client.connect("wss://robot.example:3201");

    expect(
      client.advertiseClientChannel("/cmd", "json", "std_msgs/msg/String")
    ).toBeNull();
    expect(socket.send).not.toHaveBeenCalled();
  });

  it("consumes time frames quietly while warning about malformed frames", () => {
    const socket = {
      close: vi.fn(),
      onclose: null,
      onerror: null,
      onmessage: null,
      onopen: null
    } as unknown as WebSocket;
    const client = new FoxgloveProtocolClient(() => socket);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      client.connect("ws://robot.example:3201");
      const time = new ArrayBuffer(9);
      const view = new DataView(time);
      view.setUint8(0, 0x02);
      view.setBigUint64(1, 123456789n, true);

      socket.onmessage?.({ data: time } as MessageEvent);
      expect(warn).not.toHaveBeenCalled();

      socket.onmessage?.({ data: time.slice(0, 8) } as MessageEvent);
      expect(warn).toHaveBeenCalledWith("[foxglove] malformed time frame");
    } finally {
      warn.mockRestore();
    }
  });
});
