FROM postgres

# Copy all scripts into the docker-entrypoint-initdb.d directory
COPY ./docker-entrypoint-initdb.d/* /docker-entrypoint-initdb.d/

# Make scripts executable
RUN chmod +x -R /docker-entrypoint-initdb.d/

