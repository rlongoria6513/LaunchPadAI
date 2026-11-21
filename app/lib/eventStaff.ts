import db from "@/app/lib/db";

let setupPromise: Promise<void> | null = null;

export function ensureEventStaffTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS event_staff (
          id INT AUTO_INCREMENT PRIMARY KEY,
          event_id INT NOT NULL,
          user_id INT NOT NULL,
          created_by_user_id INT NULL,
          can_scan TINYINT(1) NOT NULL DEFAULT 1,
          can_sell TINYINT(1) NOT NULL DEFAULT 0,
          can_comp TINYINT(1) NOT NULL DEFAULT 0,
          active TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY event_staff_assignment (event_id, user_id),
          INDEX event_staff_user (user_id),
          INDEX event_staff_event (event_id)
        )
      `);
    })().catch((error) => {
      setupPromise = null;
      throw error;
    });
  }

  return setupPromise;
}
