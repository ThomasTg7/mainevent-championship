import { describe, expect, it } from "vitest";
import { contactDetails } from "./contact-details";
import { defaultSetting } from "./registry";

const empty = { contact: defaultSetting("contact"), socials: defaultSetting("socials") };

describe("contactDetails", () => {
  it("has nothing to show on a new installation", () => {
    expect(contactDetails(empty.contact, empty.socials).hasDetails).toBe(false);
  });

  it("counts an email, a phone, a WhatsApp, an address or a usable network as something to show", () => {
    for (const contact of [{ email: "hola@guerracampal.cl" }, { phone: "+56 9 1234 5678" }, { whatsapp: "+56 9 1234 5678" }, { address: "Av. España 123" }]) {
      expect(contactDetails({ ...empty.contact, ...contact }, empty.socials).hasDetails).toBe(true);
    }
    expect(contactDetails(empty.contact, { ...empty.socials, instagram: "@guerracampal" }).hasDetails).toBe(true);
  });

  it("ignores the notification email (it is for the inbox, not for the public) and a network that is not a link", () => {
    expect(contactDetails({ ...empty.contact, notifyEmail: "avisos@guerracampal.cl" }, empty.socials).hasDetails).toBe(false);
    expect(contactDetails(empty.contact, { ...empty.socials, tiktok: "javascript:alert(1)" }).hasDetails).toBe(false);
  });

  it("gives the links the page draws", () => {
    const details = contactDetails({ ...empty.contact, phone: "+56 9 1234 5678", whatsapp: "+56 9 1234 5678" }, { ...empty.socials, instagram: "@guerracampal" });
    expect(details.phone).toBe("tel:+56912345678");
    expect(details.whatsapp).toBe("https://wa.me/56912345678");
    expect(details.networks.map((network) => network.network)).toEqual(["instagram"]);
  });
});
