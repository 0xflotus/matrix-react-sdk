/*
Copyright 2017 Vector Creations Ltd.

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

import MatrixClientPeg from '../../MatrixClientPeg';
import sdk from '../../index';
import { sanitizedHtmlNode } from '../../HtmlUtils';
import { _t } from '../../languageHandler';


module.exports = React.createClass({
    displayName: 'GroupView',

    propTypes: {
        groupId: React.PropTypes.string.isRequired,
    },

    getInitialState: function() {
        return {
            phase: "GroupView.LOADING",  // LOADING / DISPLAY / ERROR / NOT_FOUND
            summary: null,
            error: null,
        };
    },

    componentWillMount: function() {
        this.setState({
            phase: "GroupView.LOADING",
            summary: null,
        })
        this._loadGroupFromServer(this.props.groupId)
    },

    componentWillReceiveProps: function(new_props) {
        if (this.props.groupId != new_props.groupId) {
            this.setState({
                phase: "GroupView.LOADING",
                summary: null,
            })
            this._loadGroupFromServer(new_props.groupId);
        }
    },

    _loadGroupFromServer: function(groupId) {
        MatrixClientPeg.get().getGroupSummary(groupId).done((res) => {
            this.setState({
                phase: "GroupView.DISPLAY",
                summary: res,
            });
        }, (err) => {
            this.setState({
                phase: err.httpStatus == 404 ? "GroupView.NOT_FOUND" :"GroupView.ERROR",
                summary: null,
                error: err,
            });
        });
    },

    render: function() {
        const BaseAvatar = sdk.getComponent("avatars.BaseAvatar");
        const Loader = sdk.getComponent("elements.Spinner");

        if (this.state.phase == "GroupView.LOADING") {
            return <Loader />;
        } else if (this.state.phase == "GroupView.DISPLAY") {
            const summary = this.state.summary;
            let avatar_url = null;
            if (summary.profile.avatar_url) {
                avatar_url = MatrixClientPeg.get().mxcUrlToHttp(summary.profile.avatar_url);
            }
            let description = null;
            if (summary.profile.long_description) {
                description = sanitizedHtmlNode(summary.profile.long_description);
            }
            return (
                <div style={{maxWidth: "960px", width: "100%", "margin": "20px auto"}}>
                    <div className="mx_RoomHeader">
                        <div className="mx_RoomHeader_wrapper">
                            <div className="mx_RoomHeader_avatar">
                                <BaseAvatar url={avatar_url} name={summary.profile.name}
                                    width={48} height={48} />
                            </div>
                            <div className="mx_RoomHeader_info">
                                <div className="mx_RoomHeader_name">
                                    <span>{summary.profile.name}</span>
                                    <span style={{
                                        fontWeight: "normal",
                                        fontSize: "initial",
                                        paddingLeft: "10px",
                                    }}>
                                        ({this.props.groupId})
                                    </span>
                                </div>
                                <div className="mx_RoomHeader_topic">
                                    {summary.profile.short_description}
                                </div>
                            </div>
                        </div>
                    </div>
                    {description}
                </div>
            );
        } else if (this.state.phase == "GroupView.NOT_FOUND") {
            return (
                <div style={{margin: "auto"}}>
                    Group {this.props.groupId} not found
                </div>
            );
        } else {
            let extraText;
            if (this.state.error.errcode === 'M_UNRECOGNIZED') {
                extraText = <div>{_t('This Home server does not support groups')}</div>;
            }
            return (
                <div style={{margin: "auto"}}>
                    Failed to load {this.props.groupId}
                    {extraText}
                </div>
            );
        }
    },
});
