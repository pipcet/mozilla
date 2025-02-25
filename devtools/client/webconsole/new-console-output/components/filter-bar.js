/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {
  createClass,
  DOM: dom,
  PropTypes
} = require("devtools/client/shared/vendor/react");
const { connect } = require("devtools/client/shared/vendor/react-redux");
const { getAllFilters } = require("devtools/client/webconsole/new-console-output/selectors/filters");
const { getFilteredMessagesCount } = require("devtools/client/webconsole/new-console-output/selectors/messages");
const { getAllUi } = require("devtools/client/webconsole/new-console-output/selectors/ui");
const {
  filterBarToggle,
  defaultFiltersReset,
  filterTextSet,
  messagesClear,
} = require("devtools/client/webconsole/new-console-output/actions/index");
const { l10n } = require("devtools/client/webconsole/new-console-output/utils/messages");
const { PluralForm } = require("devtools/shared/plural-form");
const {
  DEFAULT_FILTERS,
  FILTERS,
} = require("../constants");

const FilterButton = require("devtools/client/webconsole/new-console-output/components/filter-button");

const FilterBar = createClass({

  displayName: "FilterBar",

  propTypes: {
    dispatch: PropTypes.func.isRequired,
    filter: PropTypes.object.isRequired,
    serviceContainer: PropTypes.shape({
      attachRefToHud: PropTypes.func.isRequired,
    }).isRequired,
    filterBarVisible: PropTypes.bool.isRequired,
    filteredMessagesCount: PropTypes.object.isRequired,
  },

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.filter !== this.props.filter) {
      return true;
    }

    if (nextProps.filterBarVisible !== this.props.filterBarVisible) {
      return true;
    }

    if (
      JSON.stringify(nextProps.filteredMessagesCount)
      !== JSON.stringify(this.props.filteredMessagesCount)
    ) {
      return true;
    }

    return false;
  },

  componentDidMount() {
    this.props.serviceContainer.attachRefToHud("filterBox",
      this.wrapperNode.querySelector(".text-filter"));
  },

  onClickMessagesClear: function () {
    this.props.dispatch(messagesClear());
  },

  onClickFilterBarToggle: function () {
    this.props.dispatch(filterBarToggle());
  },

  onClickRemoveAllFilters: function () {
    this.props.dispatch(defaultFiltersReset());
  },

  onClickRemoveTextFilter: function () {
    this.props.dispatch(filterTextSet(""));
  },

  onSearchInput: function (e) {
    this.props.dispatch(filterTextSet(e.target.value));
  },

  renderFiltersConfigBar() {
    const {
      dispatch,
      filter,
      filteredMessagesCount,
    } = this.props;

    const getLabel = (baseLabel, filterKey) => {
      const count = filteredMessagesCount[filterKey];
      if (filter[filterKey] || count === 0) {
        return baseLabel;
      }
      return `${baseLabel} (${count})`;
    };

    return dom.div({
      className: "devtools-toolbar webconsole-filterbar-secondary",
      key: "config-bar",
    },
      FilterButton({
        active: filter[FILTERS.ERROR],
        label: getLabel(
          l10n.getStr("webconsole.errorsFilterButton.label"),
          FILTERS.ERROR
        ),
        filterKey: FILTERS.ERROR,
        dispatch
      }),
      FilterButton({
        active: filter[FILTERS.WARN],
        label: getLabel(
          l10n.getStr("webconsole.warningsFilterButton.label"),
          FILTERS.WARN
        ),
        filterKey: FILTERS.WARN,
        dispatch
      }),
      FilterButton({
        active: filter[FILTERS.LOG],
        label: getLabel(l10n.getStr("webconsole.logsFilterButton.label"), FILTERS.LOG),
        filterKey: FILTERS.LOG,
        dispatch
      }),
      FilterButton({
        active: filter[FILTERS.INFO],
        label: getLabel(l10n.getStr("webconsole.infoFilterButton.label"), FILTERS.INFO),
        filterKey: FILTERS.INFO,
        dispatch
      }),
      FilterButton({
        active: filter[FILTERS.DEBUG],
        label: getLabel(l10n.getStr("webconsole.debugFilterButton.label"), FILTERS.DEBUG),
        filterKey: FILTERS.DEBUG,
        dispatch
      }),
      dom.span({
        className: "devtools-separator",
      }),
      FilterButton({
        active: filter[FILTERS.CSS],
        label: l10n.getStr("webconsole.cssFilterButton.label"),
        filterKey: FILTERS.CSS,
        dispatch
      }),
      FilterButton({
        active: filter[FILTERS.NETXHR],
        label: l10n.getStr("webconsole.xhrFilterButton.label"),
        filterKey: FILTERS.NETXHR,
        dispatch
      }),
      FilterButton({
        active: filter[FILTERS.NET],
        label: l10n.getStr("webconsole.requestsFilterButton.label"),
        filterKey: FILTERS.NET,
        dispatch
      })
    );
  },

  renderFilteredMessagesBar() {
    const {
      filteredMessagesCount
    } = this.props;
    const {
      global,
    } = filteredMessagesCount;

    let label = l10n.getStr("webconsole.filteredMessages.label");
    label = PluralForm.get(global, label).replace("#1", global);

    // Include all default filters that are hiding messages.
    let title = DEFAULT_FILTERS.reduce((res, filter) => {
      if (filteredMessagesCount[filter] > 0) {
        return res.concat(`${filter}: ${filteredMessagesCount[filter]}`);
      }
      return res;
    }, []).join(", ");

    return dom.div({
      className: "devtools-toolbar webconsole-filterbar-filtered-messages",
      key: "filtered-messages-bar",
    },
      dom.span({
        className: "filter-message-text",
        title,
      }, label),
      dom.button({
        className: "devtools-button reset-filters-button",
        onClick: this.onClickRemoveAllFilters
      }, l10n.getStr("webconsole.resetFiltersButton.label"))
    );
  },

  render() {
    const {
      filter,
      filterBarVisible,
      filteredMessagesCount,
    } = this.props;

    let children = [
      dom.div({
        className: "devtools-toolbar webconsole-filterbar-primary",
        key: "primary-bar",
      },
        dom.button({
          className: "devtools-button devtools-clear-icon",
          title: l10n.getStr("webconsole.clearButton.tooltip"),
          onClick: this.onClickMessagesClear
        }),
        dom.button({
          className: "devtools-button devtools-filter-icon" + (
            filterBarVisible ? " checked" : ""),
          title: l10n.getStr("webconsole.toggleFilterButton.tooltip"),
          onClick: this.onClickFilterBarToggle
        }),
        dom.input({
          className: "devtools-plaininput text-filter",
          type: "search",
          value: filter.text,
          placeholder: l10n.getStr("webconsole.filterInput.placeholder"),
          onInput: this.onSearchInput
        })
      )
    ];

    if (filteredMessagesCount.global > 0) {
      children.push(this.renderFilteredMessagesBar());
    }

    if (filterBarVisible) {
      children.push(this.renderFiltersConfigBar());
    }

    return (
      dom.div({
        className: "webconsole-filteringbar-wrapper",
        ref: node => {
          this.wrapperNode = node;
        }
      }, ...children
      )
    );
  }
});

function mapStateToProps(state) {
  return {
    filter: getAllFilters(state),
    filterBarVisible: getAllUi(state).filterBarVisible,
    filteredMessagesCount: getFilteredMessagesCount(state),
  };
}

module.exports = connect(mapStateToProps)(FilterBar);
