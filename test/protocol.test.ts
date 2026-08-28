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
});
