package db

import (
	"log"
	"net/url"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(dsn string) *gorm.DB {
	gdb, err := gorm.Open(postgres.Open(normalizeDSN(dsn)), &gorm.Config{
		Logger:                 logger.Default.LogMode(logger.Warn),
		SkipDefaultTransaction: true,
	})
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	sqlDB, err := gdb.DB()
	if err != nil {
		log.Fatalf("database pool: %v", err)
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	ensureProfileColumns(gdb)
	return gdb
}

func ensureProfileColumns(gdb *gorm.DB) {
	columns := []string{
		`"bio" TEXT`,
		`"birthPlace" TEXT`,
		`"birthDate" DATE`,
		`"gender" TEXT`,
		`"schoolName" TEXT`,
		`"schoolGrade" TEXT`,
		`"parentIncome" TEXT`,
		`"primaryTarget" TEXT`,
		`"backupTarget" TEXT`,
		`"surgeryHistory" TEXT`,
		`"eyeCondition" TEXT`,
		`"fullBodyUrl" TEXT`,
	}
	for _, column := range columns {
		if err := gdb.Exec(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS ` + column).Error; err != nil {
			log.Fatalf("profile columns: %v", err)
		}
	}
}

func normalizeDSN(dsn string) string {
	u, err := url.Parse(dsn)
	if err != nil {
		return strings.ReplaceAll(strings.ReplaceAll(dsn, "?schema=public", ""), "&schema=public", "")
	}
	q := u.Query()
	q.Del("schema")
	u.RawQuery = q.Encode()
	return u.String()
}
