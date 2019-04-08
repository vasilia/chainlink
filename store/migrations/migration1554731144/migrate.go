package migration1554731144

import (
	"github.com/jinzhu/gorm"
)

// Migration is the singleton type for this migration
type Migration struct{}

// Migrate makes run request id a constrained foreign key that cannot be null.
// Must recreate the table because sqlite3 does not support adding foreign keys
// after table creation:
//
// The only schema altering commands directly supported by SQLite are the "rename table", "rename column", and "add column"...
// https://www.sqlite.org/lang_altertable.html
// It is not possible to use the "ALTER TABLE ... ADD COLUMN" syntax to add a column that includes a REFERENCES...
// https://www.sqlite.org/foreignkeys.html
func (m Migration) Migrate(db *gorm.DB) error {
	err := db.Exec(`
   CREATE TABLE "job_runs_replacement1554731144" (
    "id" varchar(255) NOT NULL,
    "job_spec_id" varchar(36) REFERENCES job_specs(id) NOT NULL,
    "result_id" integer,
    "run_request_id" integer REFERENCES run_requests(id) ON DELETE CASCADE NOT NULL,
    "status" varchar(255),
    "created_at" datetime,
    "completed_at" datetime,
    "updated_at" datetime,
    "initiator_id" integer,
    "creation_height" varchar(255),
    "observed_height" varchar(255),
    "overrides_id" integer,
    "deleted_at" datetime,
    PRIMARY KEY ("id"))
  `).Error
	if err != nil {
		return err
	}

	err = db.Exec(`INSERT INTO job_runs_replacement1554731144 SELECT * FROM job_runs`).Error
	if err != nil {
		return err
	}

	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	err = tx.Exec(`
		ALTER TABLE "job_runs" RENAME TO "job_runs_replaced1554731144";
		ALTER TABLE "job_runs_replacement1554731144" RENAME TO "job_runs";
	`).Error
	if err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit().Error
}
