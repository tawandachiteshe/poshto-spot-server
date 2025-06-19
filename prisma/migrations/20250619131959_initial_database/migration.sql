-- CreateTable
CREATE TABLE "nas" (
    "id" SERIAL NOT NULL,
    "nasname" TEXT NOT NULL,
    "shortname" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'other',
    "ports" INTEGER,
    "secret" TEXT NOT NULL,
    "server" TEXT,
    "community" TEXT,
    "description" TEXT,
    "require_ma" TEXT NOT NULL DEFAULT 'auto',
    "limit_proxy_state" TEXT NOT NULL DEFAULT 'auto',

    CONSTRAINT "nas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nasreload" (
    "nasipaddress" INET NOT NULL,
    "reloadtime" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "nasreload_pkey" PRIMARY KEY ("nasipaddress")
);

-- CreateTable
CREATE TABLE "radacct" (
    "radacctid" BIGSERIAL NOT NULL,
    "acctsessionid" TEXT NOT NULL,
    "acctuniqueid" TEXT NOT NULL,
    "username" TEXT,
    "groupname" TEXT,
    "realm" TEXT,
    "nasipaddress" INET NOT NULL,
    "nasportid" TEXT,
    "nasporttype" TEXT,
    "acctstarttime" TIMESTAMPTZ(6),
    "acctupdatetime" TIMESTAMPTZ(6),
    "acctstoptime" TIMESTAMPTZ(6),
    "acctinterval" BIGINT,
    "acctsessiontime" BIGINT,
    "acctauthentic" TEXT,
    "connectinfo_start" TEXT,
    "connectinfo_stop" TEXT,
    "acctinputoctets" BIGINT,
    "acctoutputoctets" BIGINT,
    "calledstationid" TEXT,
    "callingstationid" TEXT,
    "acctterminatecause" TEXT,
    "servicetype" TEXT,
    "framedprotocol" TEXT,
    "framedipaddress" INET,
    "framedipv6address" INET,
    "framedipv6prefix" INET,
    "framedinterfaceid" TEXT,
    "delegatedipv6prefix" INET,
    "class" TEXT,

    CONSTRAINT "radacct_pkey" PRIMARY KEY ("radacctid")
);

-- CreateTable
CREATE TABLE "radcheck" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL DEFAULT '',
    "attribute" TEXT NOT NULL DEFAULT '',
    "op" VARCHAR(2) NOT NULL DEFAULT '==',
    "value" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "radcheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radgroupcheck" (
    "id" SERIAL NOT NULL,
    "groupname" TEXT NOT NULL DEFAULT '',
    "attribute" TEXT NOT NULL DEFAULT '',
    "op" VARCHAR(2) NOT NULL DEFAULT '==',
    "value" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "radgroupcheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radgroupreply" (
    "id" SERIAL NOT NULL,
    "groupname" TEXT NOT NULL DEFAULT '',
    "attribute" TEXT NOT NULL DEFAULT '',
    "op" VARCHAR(2) NOT NULL DEFAULT '=',
    "value" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "radgroupreply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radpostauth" (
    "id" BIGSERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "pass" TEXT,
    "reply" TEXT,
    "calledstationid" TEXT,
    "callingstationid" TEXT,
    "authdate" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "class" TEXT,

    CONSTRAINT "radpostauth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radreply" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL DEFAULT '',
    "attribute" TEXT NOT NULL DEFAULT '',
    "op" VARCHAR(2) NOT NULL DEFAULT '=',
    "value" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "radreply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radusergroup" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL DEFAULT '',
    "groupname" TEXT NOT NULL DEFAULT '',
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "radusergroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nas_nasname" ON "nas"("nasname");

-- CreateIndex
CREATE UNIQUE INDEX "radacct_acctuniqueid_key" ON "radacct"("acctuniqueid");

-- CreateIndex
CREATE INDEX "radacct_bulk_timeout" ON "radacct"("acctstoptime", "acctupdatetime");

-- CreateIndex
CREATE INDEX "radacct_start_user_idx" ON "radacct"("acctstarttime", "username");

-- CreateIndex
CREATE INDEX "radcheck_username" ON "radcheck"("username", "attribute");

-- CreateIndex
CREATE INDEX "radgroupcheck_groupname" ON "radgroupcheck"("groupname", "attribute");

-- CreateIndex
CREATE INDEX "radgroupreply_groupname" ON "radgroupreply"("groupname", "attribute");

-- CreateIndex
CREATE INDEX "radreply_username" ON "radreply"("username", "attribute");

-- CreateIndex
CREATE INDEX "radusergroup_username" ON "radusergroup"("username");
