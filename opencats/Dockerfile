FROM ubuntu:jammy
# Extra installations
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    # libfreetype6-dev \
    # sudo \
    # libjpeg62-turbo-dev \
    # libmcrypt-dev \
    # libncurses5-dev \
    # libicu-dev \
    # libmemcached-dev \
    # libcurl4-openssl-dev \
    # libpng-dev \
    # libgmp-dev \
    # libxml2-dev \
    # libldap2-dev \
    curl \
    zlib1g-dev \
    msmtp \  
    antiword \
    poppler-utils \
    html2text \
    unrtf \
    git \
    unzip

# Apache
ARG RELEASE
ARG LAUNCHPAD_BUILD_ARCH
LABEL org.opencontainers.image.ref.name=ubuntu
LABEL org.opencontainers.image.version=22.04
RUN apt-get update && apt-get install -y tzdata
ENV TZ=Asia/Manila
RUN ln -sf /usr/share/zoneinfo/$TZ /etc/localtime && dpkg-reconfigure -f noninteractive tzdata # buildkit
RUN apt-get install -y apache2 wget unzip # buildkit
RUN apt-get install -y software-properties-common && add-apt-repository ppa:ondrej/php && apt-get update # buildkit
RUN apt-get install -y php7.2 php7.2-soap php7.2-ldap php7.2-mysqli php7.2-gd php7.2-xml php7.2-curl php7.2-mbstring php7.2-zip # buildkit
RUN update-alternatives --set php /usr/bin/php7.2 # buildkit
RUN service apache2 restart # buildkit
# RUN wget https://github.com/opencats/OpenCATS/releases/download/0.9.7.4/opencats-0.9.7.4-full.zip # buildkit
# RUN unzip opencats-0.9.7.4-full.zip && rm opencats-0.9.7.4-full.zip # buildkit

WORKDIR /tmp
RUN git clone https://github.com/opencats/OpenCATS.git opencats && \
    git -C opencats checkout `git -C opencats describe --tags $(git -C opencats rev-list --tags --max-count=1)`

RUN cp -r /tmp/opencats/. /var/www/html/

WORKDIR /var/www/html
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer && \
    composer install

COPY config.php config.php
RUN chown -R www-data:www-data . # buildkit
RUN chmod 770 attachments # buildkit
RUN chmod 770 upload # buildkit
RUN rm index.html
EXPOSE 80
CMD apachectl -D FOREGROUND
