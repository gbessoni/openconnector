declare module "facebook-nodejs-business-sdk" {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  export class UserData {
    setEmails(v: string[]): this;
    setPhones(v: string[]): this;
    setFirstNames(v: string[]): this;
    setLastNames(v: string[]): this;
    setFbp(v: string): this;
    setFbc(v: string): this;
    setClientIpAddress(v: string): this;
    setClientUserAgent(v: string): this;
  }

  export class CustomData {
    setValue(v: number): this;
    setCurrency(v: string): this;
    setOrderId(v: string): this;
  }

  export class ServerEvent {
    setEventName(v: string): this;
    setEventTime(v: number): this;
    setEventId(v: string): this;
    setEventSourceUrl(v: string): this;
    setActionSource(v: "website" | "email" | "system_generated" | "other"): this;
    setUserData(v: UserData): this;
    setCustomData(v: CustomData): this;
  }

  export class EventRequest {
    constructor(token: string, pixelId: string);
    setEvents(v: ServerEvent[]): this;
    setTestEventCode(v: string): this;
    execute(): Promise<any>;
  }

  const bizSdk: {
    UserData: typeof UserData;
    CustomData: typeof CustomData;
    ServerEvent: typeof ServerEvent;
    EventRequest: typeof EventRequest;
  };

  export default bizSdk;
}
