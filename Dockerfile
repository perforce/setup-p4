FROM debian:11.2-slim

ENV P4_VERSION=21.2

RUN apt-get update && \
    apt-get -y install wget && \
    wget https://ftp.perforce.com/perforce/r$P4_VERSION/bin.linux26x86_64/p4 && \
    mv p4 /usr/bin/p4 && \
    chmod +x /usr/bin/p4

COPY "entrypoint.sh" "/entrypoint.sh"

ENTRYPOINT ["/entrypoint.sh"]
