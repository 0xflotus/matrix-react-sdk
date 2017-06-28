/*
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

const React = require('react');
const MatrixClientPeg = require('../../../MatrixClientPeg');

export default React.createClass({
    displayName: 'AppTile',

    propTypes: {
        id: React.PropTypes.string.isRequired,
        url: React.PropTypes.string.isRequired,
        name: React.PropTypes.string.isRequired,
        room: React.PropTypes.object.isRequired,
    },

    getDefaultProps: function() {
        return {
            url: "",
        };
    },

    _onEditClick: function() {
        console.log("Edit widget %s", this.props.id);
    },

    _onDeleteClick: function() {
        console.log("Delete widget %s", this.props.id);
        const appsStateEvents = this.props.room.currentState.getStateEvents('im.vector.modular.widgets', '');
        if (!appsStateEvents) {
            return;
        }
        const appsStateEvent = appsStateEvents.getContent();
        if (appsStateEvent[this.props.id]) {
            delete appsStateEvent[this.props.id];
            MatrixClientPeg.get().sendStateEvent(
                this.props.room.roomId,
                'im.vector.modular.widgets',
                appsStateEvent,
                '',
            ).then(() => {
                console.log('Deleted widget');
            }, (e) => {
                console.error('Failed to delete widget', e);
            });
        }
    },

    formatAppTileName: function() {
        let appTileName = "No name";
        if(this.props.name && this.props.name.trim()) {
            appTileName = this.props.name.trim();
            appTileName = appTileName[0].toUpperCase() + appTileName.slice(1).toLowerCase();
        }
        return appTileName;
    },

    render: function() {
        return (
            <div className={this.props.fullWidth ? "mx_AppTileFullWidth" : "mx_AppTile"} id={this.props.id}>
                <div className="mx_AppTileMenuBar">
                    {this.formatAppTileName()}
                    <span className="mx_AppTileMenuBarWidgets">
                        {/* Edit widget */}
                        {/* <img
                            src="img/edit.svg"
                            className="mx_filterFlipColor mx_AppTileMenuBarWidget mx_AppTileMenuBarWidgetPadding"
                            width="8" height="8" alt="Edit"
                            onClick={this._onEditClick}
                        /> */}

                        {/* Delete widget */}
                        <img src="img/cancel.svg"
                        className="mx_filterFlipColor mx_AppTileMenuBarWidget"
                        width="8" height="8" alt="Cancel"
                        onClick={this._onDeleteClick}
                        />
                    </span>
                </div>
                <div className="mx_AppTileBody">
                    <iframe ref="appFrame" src={this.props.url} allowFullScreen="true"></iframe>
                </div>
            </div>
        );
    },
});
