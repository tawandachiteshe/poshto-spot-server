
FROM freeradius/freeradius-server:latest
RUN apt-get update && apt-get install -y \
    freeradius \
    freeradius-postgresql \
    libpq-dev \
    postgresql-client \
    postgresql \
    libpq5 \
    && ldconfig \
    && rm -rf /var/lib/apt/lists/*

RUN ldd /usr/lib/freeradius/rlm_sql_postgresql.so
RUN whoami
COPY raddb/ /etc/raddb/
