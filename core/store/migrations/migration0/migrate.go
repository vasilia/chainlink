package migration0

import (
	"github.com/jinzhu/gorm"
	"github.com/smartcontractkit/chainlink/core/store/models"
)

type Migration struct{}

func (m Migration) Migrate(tx *gorm.DB) error {
	if err := tx.AutoMigrate(&models.JobSpec{}).Error; err != nil {
		return err
	}
	if err := tx.AutoMigrate(&models.TaskSpec{}).Error; err != nil {
		return err
	}
	if err := createJobRunsTable(tx); err != nil {
		return err
	}
	if err := tx.AutoMigrate(&models.TaskRun{}).Error; err != nil {
		return err
	}
	if err := tx.AutoMigrate(&models.RunResult{}).Error; err != nil {
		return err
	}
	if err := tx.AutoMigrate(&models.Initiator{}).Error; err != nil {
		return err
	}
	if err := tx.AutoMigrate(&models.Tx{}).Error; err != nil {
		return err
	}
	if err := tx.AutoMigrate(&models.TxAttempt{}).Error; err != nil {
		return err
	}
	if err := tx.AutoMigrate(&models.BridgeType{}).Error; err != nil {
		return err
	}
	if err := tx.AutoMigrate(&models.Head{}).Error; err != nil {
		return err
	}
	if err := tx.AutoMigrate(&models.User{}).Error; err != nil {
		return err
	}
	if err := tx.AutoMigrate(&models.Session{}).Error; err != nil {
		return err
	}
	if err := tx.AutoMigrate(&models.Encumbrance{}).Error; err != nil {
		return err
	}
	return tx.AutoMigrate(&models.ServiceAgreement{}).Error
}

func createJobRunsTable(tx *gorm.DB) error {
	return tx.Exec(`
   CREATE TABLE "job_runs" (
    "id" varchar(255) NOT NULL,
    "job_spec_id" varchar(36) REFERENCES job_specs(id) NOT NULL,
    "result_id" integer,
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
}
