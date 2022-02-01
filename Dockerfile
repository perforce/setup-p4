FROM alpine:3.15.0

ENV P4_VERSION=21.2

RUN wget https://ftp.perforce.com/perforce/r$P4_VERSION/bin.linux26x86_64/p4; chmod +x p4

COPY "entrypoint.sh" "/entrypoint.sh"

ENTRYPOINT ["/entrypoint.sh"]
