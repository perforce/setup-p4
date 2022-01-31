FROM alpine:3.10

CMD curl -O https://ftp.perforce.com/perforce/r21.2/bin.linux26x86_64/p4

COPY "entrypoint.sh" "/entrypoint.sh"

ENTRYPOINT ["/entrypoint.sh"]
