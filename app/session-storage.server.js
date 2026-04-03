import { Session } from "@shopify/shopify-api";
import db from "./db.server";

export class D1SessionStorage {
  async storeSession(session) {
    const data = this.sessionToRow(session);

    await db.session.upsert({
      where: { id: session.id },
      update: data,
      create: data,
    });

    return true;
  }

  async loadSession(id) {
    const row = await db.session.findUnique({
      where: { id },
    });

    if (!row) return undefined;
    return this.rowToSession(row);
  }

  async deleteSession(id) {
    try {
      await db.session.delete({
        where: { id },
      });
    } catch {
      return true;
    }

    return true;
  }

  async deleteSessions(ids) {
    await db.session.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return true;
  }

  async findSessionsByShop(shop) {
    const rows = await db.session.findMany({
      where: { shop },
      orderBy: { expires: "desc" },
    });

    return rows.map((row) => this.rowToSession(row));
  }

  sessionToRow(session) {
    const sessionObject = session.toObject();
    const user = sessionObject.onlineAccessInfo?.associated_user;

    return {
      id: session.id,
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline,
      scope: session.scope ?? null,
      expires: session.expires ?? null,
      accessToken: session.accessToken ?? "",
      userId: user?.id ? BigInt(user.id) : null,
    };
  }

  rowToSession(row) {
    const session = new Session({
      id: row.id,
      shop: row.shop,
      state: row.state,
      isOnline: row.isOnline,
    });

    session.scope = row.scope ?? undefined;
    session.expires = row.expires ?? undefined;
    session.accessToken = row.accessToken ?? undefined;

    if (row.userId) {
      session.onlineAccessInfo = {
        expires_in: 0,
        associated_user_scope: row.scope ?? "",
        associated_user: {
          id: Number(row.userId),
        },
      };
    }

    return session;
  }
}
