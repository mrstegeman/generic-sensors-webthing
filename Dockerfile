#!/bin/echo docker build . -f
# -*- coding: utf-8 -*-
# SPDX-License-Identifier: MPL-2.0
#{
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/ .
#}

FROM mozillaiot/gateway:latest
MAINTAINER Philippe Coval (p.coval@samsung.com)

ENV DEBIAN_FRONTEND noninteractive
ENV LC_ALL en_US.UTF-8
ENV LANG ${LC_ALL}


ENV project mozilla-generic-sensors-adapter

ADD . /root/.mozilla-iot/addons/generic-sensors-adapter
WORKDIR /root/.mozilla-iot/addons/${project}
RUN echo "#log: ${project}: Preparing sources" \
  && ls \
  && which yarn || npm install -g yarn \
  && sync

WORKDIR /root/.mozilla-iot/addons/generic-sensors-adapter
RUN echo "#log: ${project}: Building sources" \
  && ./package.sh \
  && sync

WORKDIR /root/.mozilla-iot/addons/generic-sensors-adapter
RUN echo "#log: ${project}: Installing sources" \
  && set -x \
  && install -d /usr/local/src/${project}/ \
  && install generic-sensors-adapter-*.tgz /usr/local/src/${project}/ \
  && sync

