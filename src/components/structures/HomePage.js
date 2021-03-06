/*
Copyright 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd

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
import PropTypes from 'prop-types';
import request from 'browser-request';
import { _t } from '../../languageHandler';
import sanitizeHtml from 'sanitize-html';
import sdk from '../../index';
import { MatrixClient } from 'matrix-js-sdk';
import dis from '../../dispatcher';

class HomePage extends React.Component {
    static displayName = 'HomePage';

    static propTypes = {
        // URL base of the team server. Optional.
        teamServerUrl: PropTypes.string,
        // Team token. Optional. If set, used to get the static homepage of the team
        //      associated. If unset, homePageUrl will be used.
        teamToken: PropTypes.string,
        // URL to use as the iFrame src. Defaults to /home.html.
        homePageUrl: PropTypes.string,
    };

    static contextTypes = {
        matrixClient: PropTypes.instanceOf(MatrixClient),
    };

    state = {
            iframeSrc: '',
            page: '',
    };

    translate(s) {
        // default implementation - skins may wish to extend this
        return sanitizeHtml(_t(s));
    }

    componentWillMount() {
        this._unmounted = false;

        if (this.props.teamToken && this.props.teamServerUrl) {
            this.setState({
                iframeSrc: `${this.props.teamServerUrl}/static/${this.props.teamToken}/home.html`,
            });
        } else {
            // we use request() to inline the homepage into the react component
            // so that it can inherit CSS and theming easily rather than mess around
            // with iframes and trying to synchronise document.stylesheets.

            const src = this.props.homePageUrl || 'home.html';

            request(
                { method: "GET", url: src },
                (err, response, body) => {
                    if (this._unmounted) {
                        return;
                    }

                    if (err || response.status < 200 || response.status >= 300) {
                        console.warn(`Error loading home page: ${err}`);
                        this.setState({ page: _t("Couldn't load home page") });
                        return;
                    }

                    body = body.replace(/_t\(['"]([\s\S]*?)['"]\)/mg, (match, g1)=>this.translate(g1));
                    this.setState({ page: body });
                },
            );
        }
    }

    componentWillUnmount() {
        this._unmounted = true;
    }

    onLoginClick() {
        dis.dispatch({ action: 'start_login' });
    }

    onRegisterClick() {
        dis.dispatch({ action: 'start_registration' });
    }

    render() {
        let guestWarning = "";
        if (this.context.matrixClient.isGuest()) {
            guestWarning = (
                <div className="mx_HomePage_guest_warning">
                    <img src="img/warning.svg" width="24" height="23" />
                    <div>
                        <div>
                            { _t("You are currently using Riot anonymously as a guest.") }
                        </div>
                        <div>
                            { _t(
                                'If you would like to create a Matrix account you can <a>register</a> now.',
                                {},
                                { 'a': (sub) => <a href="#" onClick={this.onRegisterClick}>{ sub }</a> },
                            ) }
                        </div>
                        <div>
                            { _t(
                                'If you already have a Matrix account you can <a>log in</a> instead.',
                                {},
                                { 'a': (sub) => <a href="#" onClick={this.onLoginClick}>{ sub }</a> },
                            ) }
                        </div>
                    </div>
                </div>
            );
        }

        if (this.state.iframeSrc) {
            return (
                <div className="mx_HomePage">
                    { guestWarning }
                    <iframe src={ this.state.iframeSrc } />
                </div>
            );
        } else {
            const GeminiScrollbarWrapper = sdk.getComponent("elements.GeminiScrollbarWrapper");
            return (
                <GeminiScrollbarWrapper autoshow={true} className="mx_HomePage">
                    { guestWarning }
                    <div className="mx_HomePage_body" dangerouslySetInnerHTML={{ __html: this.state.page }}>
                    </div>
                </GeminiScrollbarWrapper>
            );
        }
    }
}

module.exports = HomePage;
