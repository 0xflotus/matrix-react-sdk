/*
Copyright 2015, 2016 OpenMarket Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';

import React from 'react';
import MFileBody from './MFileBody';
import MatrixClientPeg from '../../../MatrixClientPeg';
import ImageUtils from '../../../ImageUtils';
import Modal from '../../../Modal';
import sdk from '../../../index';
import dis from '../../../dispatcher';
import DecryptFile from '../../../utils/DecryptFile';

module.exports = React.createClass({
    displayName: 'MImageBody',

    propTypes: {
        /* the MatrixEvent to show */
        mxEvent: React.PropTypes.object.isRequired,
    },

    getInitialState: function() {
        return {
            decryptedUrl: null,
        };
    },


    onClick: function onClick(ev) {
        if (ev.button == 0 && !ev.metaKey) {
            ev.preventDefault();
            var content = this.props.mxEvent.getContent();
            var httpUrl = this._getContentUrl();
            var ImageView = sdk.getComponent("elements.ImageView");
            var params = {
                src: httpUrl,
                mxEvent: this.props.mxEvent
            };

            if (content.info) {
                params.width = content.info.w;
                params.height = content.info.h;
                params.fileSize = content.info.size;
            }

            Modal.createDialog(ImageView, params, "mx_Dialog_lightbox");
        }
    },

    _isGif: function() {
        var content = this.props.mxEvent.getContent();
        return (content && content.info && content.info.mimetype === "image/gif");
    },

    onImageEnter: function(e) {
        if (!this._isGif()) {
            return;
        }
        var imgElement = e.target;
        imgElement.src = this._getContentUrl();
    },

    onImageLeave: function(e) {
        if (!this._isGif()) {
            return;
        }
        var imgElement = e.target;
        imgElement.src = this._getThumbUrl();
    },

    _getContentUrl: function() {
        const content = this.props.mxEvent.getContent();
        if (content.file !== undefined) {
            return this.state.decryptedUrl;
        } else {
            return MatrixClientPeg.get().mxcUrlToHttp(content.url);
        }
    },

    _getThumbUrl: function() {
        const content = this.props.mxEvent.getContent();
        if (content.file !== undefined) {
            // TODO: Decrypt and use the thumbnail file if one is present.
            return this.state.decryptedUrl;
        } else {
            return MatrixClientPeg.get().mxcUrlToHttp(content.url, 800, 600);
        }
    },

    componentDidMount: function() {
        this.dispatcherRef = dis.register(this.onAction);
        this.fixupHeight();
        const content = this.props.mxEvent.getContent();
        if (content.file !== undefined && this.state.decryptedUrl === null) {
            DecryptFile.decryptFile(content.file).done((url) => {
                this.setState({
                    decryptedUrl: url,
                });
            }, (err) => {
                console.warn("Unable to decrypt attachment: ", err)
                // Set a placeholder image when we can't decrypt the image.
                this.refs.image.src = "img/warning.svg";
            });
        }
    },

    componentWillUnmount: function() {
        dis.unregister(this.dispatcherRef);
    },

    onAction: function(payload) {
        if (payload.action === "timeline_resize") {
            this.fixupHeight();
        }
    },

    fixupHeight: function() {
        if (!this.refs.image) {
            console.warn("Refusing to fix up height on MImageBody with no image element");
            return;
        }

        var content = this.props.mxEvent.getContent();

        var thumbHeight = null;
        var timelineWidth = this.refs.body.offsetWidth;
        var maxHeight = 600; // let images take up as much width as they can so long as the height doesn't exceed 600px.
        // the alternative here would be 600*timelineWidth/800; to scale them down to fit inside a 4:3 bounding box

        //console.log("trying to fit image into timelineWidth of " + this.refs.body.offsetWidth + " or " + this.refs.body.clientWidth);
        if (content.info) {
            thumbHeight = ImageUtils.thumbHeight(content.info.w, content.info.h, timelineWidth, maxHeight);
        }
        this.refs.image.style.height = thumbHeight + "px";
        // console.log("Image height now", thumbHeight);
    },

    render: function() {
        var TintableSvg = sdk.getComponent("elements.TintableSvg");
        var content = this.props.mxEvent.getContent();

        if (content.file !== undefined && this.state.decryptedUrl === null) {

            // Need to decrypt the attachment
            // The attachment is decrypted in componentDidMount.
            // For now add an img tag with a spinner.
            return (
                <span className="mx_MImageBody" ref="body">
                <img className="mx_MImageBody_thumbnail" src="img/spinner.gif" ref="image"
                    alt={content.body} />
                </span>
            );
        }

        var contentUrl = this._getContentUrl();
        var thumbUrl = this._getThumbUrl();

        if (thumbUrl) {
            return (
                <span className="mx_MImageBody" ref="body">
                    <a href={contentUrl} onClick={ this.onClick }>
                        <img className="mx_MImageBody_thumbnail" src={thumbUrl} ref="image"
                            alt={content.body}
                            onMouseEnter={this.onImageEnter}
                            onMouseLeave={this.onImageLeave} />
                    </a>
                    <MFileBody {...this.props} decryptedUrl={this.state.decryptedUrl} />
                </span>
            );
        } else if (content.body) {
            return (
                <span className="mx_MImageBody">
                    Image '{content.body}' cannot be displayed.
                </span>
            );
        } else {
            return (
                <span className="mx_MImageBody">
                    This image cannot be displayed.
                </span>
            );
        }
    },
});
