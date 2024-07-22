import $ from 'jquery';
import jszip from 'jszip';
import DataTable from 'datatables.net-bs5';
import 'datatables.net-buttons-bs5';
import 'datatables.net-buttons/js/buttons.html5.mjs';
import 'datatables.net-responsive-bs5';
import 'datatables.net-select-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'datatables.net-buttons-bs5/css/buttons.bootstrap5.min.css';
import 'datatables.net-responsive-bs5/css/responsive.bootstrap5.min.css';
import 'datatables.net-select-bs5/css/select.bootstrap5.min.css';
import iziToast from 'izitoast';
import Fuse from 'fuse.js';
import Tagify from '@yaireo/tagify';
import 'izitoast/dist/css/iziToast.min.css';
import '@yaireo/tagify/dist/tagify.css';
import unidecode from 'unidecode';

// Constants and Configuration
const bannedTitles = [
  {
    name: 'Days of My Youth',
    imdb: 'tt4123262',
  },
  {
    name: 'Deadmau5 Teaches Electronic Music Production (MasterClass 2016)',
    imdb: null,
  },
  { name: 'Deathgrip', imdb: 'tt7046112' },
  {
    name: 'Depth Perception',
    imdb: null,
  },
  {
    name: 'Distance Between Dreams',
    imdb: 'tt6255746',
  },
  {
    name: 'Don Cornelius - The Best of Soul Train',
    imdb: null,
  },
  {
    name: 'The Dream Factory',
    imdb: 'tt2713938',
  },
  {
    name: 'Emerica Stay Gold Skate DVD',
    imdb: null,
  },
  { name: 'f2', imdb: null },
  {
    name: 'Fantasia Boxset',
    imdb: null,
  },
  { name: 'The Fear', imdb: 'tt2316238' },
  {
    name: 'Few Words',
    imdb: 'tt2899432',
  },
  {
    name: 'Friday the 13th Killer Bonus Disc',
    imdb: null,
  },
  {
    name: 'Get Smart: The Complete Series',
    imdb: 'tt0111982',
  },
  {
    name: 'Hamilton: An American Musical (bootleg)',
    imdb: null,
  },
  {
    name: 'Hammer House of Horror',
    imdb: 'tt0080231',
  },
  {
    name: 'Hard Grit',
    imdb: 'tt2151649',
  },
  {
    name: 'How to Train Your Dragon (DVD Sampler)',
    imdb: 'tt0892769',
  },
  { name: 'In The High Country', imdb: 'tt5360478' },
  {
    name: 'Into the Mind',
    imdb: 'tt2673812',
  },
  { name: 'King Lines', imdb: 'tt1144805' },
  {
    name: 'Maigret in Montmartre',
    imdb: 'tt6429934',
  },
  { name: 'Maigret Sets a Trap', imdb: 'tt5012394' },
  {
    name: "Maigret's Dead Man",
    imdb: 'tt5017060',
  },
  {
    name: 'Mobile Suit Gundam 00 Special Edition 1: Celestial Being',
    imdb: 'tt3744046',
  },
  {
    name: 'Mobile Suit Gundam 00 Special Edition 2: End of World',
    imdb: 'tt3744082',
  },
  {
    name: 'Mobile Suit Gundam 00 Special Edition 3: Return of the World',
    imdb: 'tt3744084',
  },
  {
    name: 'Most Dangerous Game (2020)',
    imdb: 'tt10580064',
  },
  { name: 'Moving Art: Forests', imdb: 'tt3630314' },
  {
    name: 'Mysterious Barricades',
    imdb: null,
  },
  {
    name: 'Never Ending Thermal',
    imdb: 'tt0470870',
  },
  {
    name: 'NHL Original Six Series - The New York Rangers 1994 Stanley Cup Champions',
    imdb: null,
  },
  {
    name: 'Official 2013 World Series Film',
    imdb: 'tt3576466',
  },
  {
    name: 'Okkupert AKA Occupied',
    imdb: 'tt4192998',
  },
  {
    name: 'One Night Stan',
    imdb: null,
  },
  {
    name: 'Ozzy Osbourne: Memoirs of a Madman',
    imdb: 'tt5424892',
  },
  {
    name: 'The Phantom Limbs - Whole Loto Love (Limbs Live 1999-2004)',
    imdb: null,
  },
  {
    name: 'Phish: New Years 2016',
    imdb: null,
  },
  {
    name: 'Race Across the Sky: The Leadville Trail 100',
    imdb: 'tt1667897',
  },
  { name: 'Reel Rock Tour', imdb: 'tt2250763' },
  {
    name: 'Reveal the Path',
    imdb: 'tt2166804',
  },
  {
    name: 'Russian Lolita',
    imdb: 'tt4136094',
  },
  {
    name: 'Saturday Night Live: The Best of Mike Myers',
    imdb: 'tt0500163',
  },
  {
    name: 'Scourge of Worlds - A Dungeons & Dragons Adventure',
    imdb: null,
  },
  {
    name: '"Sherlock" The Abominable Bride',
    imdb: 'tt3845232',
  },
  {
    name: 'Stanley Cup Champions 2015',
    imdb: 'tt4862694',
  },
  {
    name: 'Sunrise Earth',
    imdb: 'tt0784945',
  },
  {
    name: 'Supervention',
    imdb: 'tt3309038',
  },
  {
    name: 'Tantra - Das Geheimnis sexueller Ekstase',
    imdb: 'tt1764627',
  },
  {
    name: "That's It, That's All.",
    imdb: 'tt1346516',
  },
  {
    name: 'Time Capsule',
    imdb: 'tt0354352',
  },
  {
    name: 'Top Gear At The Movies',
    imdb: 'tt2202611',
  },
  {
    name: 'Trailnotes',
    imdb: 'tt2244242',
  },
  {
    name: "Umphrey's McGee Red. Rocks. Repeat.",
    imdb: null,
  },
  { name: 'Uno: The Movie', imdb: 'tt6290024' },
  {
    name: 'UnReal',
    imdb: 'tt5180998',
  },
  { name: 'The Xtacles', imdb: 'tt1315861' },
  {
    name: 'Yeezy Season 3',
    imdb: null,
  },
  {
    name: 'Where the Trail Ends',
    imdb: 'tt2509922',
  },
  {
    name: 'Wintervention',
    imdb: 'tt1741682',
  },
  {
    name: 'WWE: OMG! Volume 2 - The Top 50 Incidents in WCW',
    imdb: 'tt4300602',
  },
  { name: 'Yeah Right! (2003)', imdb: 'tt0368456' },
];
const bannedTypes = [
  'CAM',
  'TS',
  'TC',
  'R5',
  'DVDScr',
  'TDTRip',
  'HDRip',
  'VODRip',
  'Pre-Retail',
  'CAMRip',
  'WEBRip',
  'PDTV',
  'SDTV',
  'HDTV',
  'Telecine',
  'Telesync',
  'Workprint',
  'TVRip',
  'SDTVRip',
  'PDTVRip',
  'HDTVRip',
];
const bannedPhrases = [
  'PilotsEYE',
  'PilotsEYE.tv',
  'Poputepipikku',
  'Saturday Night Live Best Of Series',
  'Earn Everything',
  'Miles to Go',
  "Peyton's Places",
  'Resen',
  'Llamentol',
];
const bannedReleaseGroups = [
  'aXXo',
  'BMDRu',
  'BRrip',
  'CM8',
  'CrEwSaDe',
  'CTFOH',
  'd3g',
  'DNL',
  'FaNGDiNG0',
  'HD2DVD',
  'HDTime',
  'ION10',
  'iPlanet',
  'KiNGDOM',
  'mHD',
  'mSD',
  'nHD',
  'nikt0',
  'nSD',
  'NhaNc3',
  'OFT',
  'PRODJi',
  'SANTi',
  'SPiRiT',
  'STUTTERSHIT',
  'ViSION',
  'VXT',
  'WAF',
  'x0r',
  'YIFY',
];

// Fuse.js Configuration
const fuseOptions = {
  includeScore: true,
  threshold: 0.3,
  minMatchCharLength: 3,
};
const fuseTitles = new Fuse(bannedTitles, fuseOptions);
const fusePhrases = new Fuse(bannedPhrases, fuseOptions);

// Realtime Unidecode
const unicodeInputText = document.getElementById('unicodeInputText');
const unicodeOutputText = document.getElementById('unicodeOutputText');
if (unicodeInputText && unicodeOutputText) {
  function updateOutput() {
    unicodeOutputText.value = unidecode(unicodeInputText.value);
  }
  unicodeInputText.addEventListener('input', updateOutput);
}

// Utility Functions
export function getServerData(key) {
  return (window.SERVER_DATA && window.SERVER_DATA[key]) || null;
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });
}

export function isBannedTypeOrGroup(url) {
  const urlParts = url.split('/');
  const torrentInfo = urlParts[urlParts.length - 1];
  const parts = torrentInfo.split('-');
  for (const bannedType of bannedTypes) {
    if (parts.some(part => part.toLowerCase() === bannedType.toLowerCase())) {
      console.log('Banned type:', bannedType);
      return true;
    }
  }
  for (const bannedGroup of bannedReleaseGroups) {
    if (parts[parts.length - 1].toLowerCase() === bannedGroup.toLowerCase()) {
      console.log('Banned group:', bannedGroup);
      return true;
    }
  }
  return false;
}

export function isBannedContent(torrentName) {
  const titleMatches = fuseTitles.search(torrentName);
  if (titleMatches.length > 0 && titleMatches[0].score <= 0.3) {
    console.log('Banned title:', titleMatches[0].item.name);
    return true;
  }
  const phraseMatches = fusePhrases.search(torrentName);
  if (phraseMatches.length > 0 && phraseMatches[0].score <= 0.3) {
    console.log('Banned phrase:', phraseMatches[0].item);
    return true;
  }
  return false;
}

// Content Check Functions
export function checkBannedContent(table) {
  let bannedCount = 0;
  table.rows().every(function (rowIdx, tableLoop, rowLoop) {
    if (!this.node() || !this.node().offsetParent) {
      return;
    }

    const data = this.data();
    const $row = $(this.node());

    const isBannedTitle = isBannedContent(data.title);
    const isBannedUrl = isBannedTypeOrGroup(data.url);

    if (isBannedTitle || isBannedUrl) {
      $row.addClass('banned-content');
      bannedCount++;
    } else {
      $row.removeClass('banned-content');
    }
  });
  if (bannedCount === 0) {
    iziToast.success({
      title: 'Banned Content Check',
      message:
        'No visible banned content found, but be sure to check all pages and ✔ items.',
      position: 'topRight',
    });
  } else {
    iziToast.error({
      title: 'Banned Content Check',
      message: `Found ${bannedCount} items with banned content.`,
      position: 'topRight',
    });
  }
}

// Main Initialization Function
function initializeMissingMovies() {
  // Cache DOM elements
  const $missingTable = $('#missingTable');
  const $hideProcessed = $('#hideProcessed');
  const $toggleAllProcessed = $('#toggleAllProcessed');
  const $moveCheckedToIgnored = $('#moveCheckedToIgnored');
  const $checkAllMovies = $('#checkAllMovies');
  const $trackerUrlOpen = $('#tracker-url-open');
  const $checkBannedContent = $('#checkBannedContent');

  // State management
  let editingRow = null;
  const matches = getServerData('matches');

  // Custom filtering function to hide processed rows
  $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
    const hideProcessed = $hideProcessed.is(':checked');
    const processed = data[1] === 'processed';
    return !hideProcessed || !processed;
  });
  // DataTable Initialization
  const table = $missingTable.DataTable({
    data: matches,
    columns: [
      {
        className: 'align-middle tc-index',
        data: null,
        orderable: true,
        render: function (data, type, row, meta) {
          return meta.row + 1;
        },
        title: '#',
      },
      {
        className: 'align-middle tc-processed',
        data: 'processed',
        orderable: false,
        render: function (data, type, row) {
          if (type === 'display') {
            return `
            <div class="form-check">
              <input type="checkbox" class="form-check-input large-checkbox processed-checkbox"
                ${data ? 'checked' : ''} data-id="${row.imdb_url}">
            </div>`;
          }
          return data ? 'processed' : 'unprocessed';
        },
      },
      {
        className: 'align-middle tc-edit',
        data: null,
        orderable: false,
        render: function () {
          return '<button class="btn btn-sm btn-warning edit-icon"><i class="fas fa-pencil-alt"></i></button>';
        },
      },
      {
        className: 'align-middle tc-imdb-url',
        data: 'imdb_url',
        render: function (data) {
          const imdbId = data.split('/title/')[1].replace('/', '');
          return `<a href="${data}" target="_blank" data-clipboard-text="${imdbId}">${data}</a>`;
        },
      },
      {
        className: 'align-middle tc-tracker-url',
        data: 'url',
        orderable: false,
        render: function (data) {
          return data
            ? `<a href="${data}" title="${data}" target="_blank">${data}</a>`
            : '';
        },
      },
      {
        className: 'align-middle tc-poster',
        data: 'poster_url',
        render: function (data) {
          return data
            ? `<img src="${data}" alt="Poster" class="img-fluid poster-thumb">`
            : '';
        },
      },
      {
        className: 'align-middle tc-title',
        data: 'title',
        render: function (data, type, row) {
          return data
            ? `${data} <a title="Search by name & year" href="https://passthepopcorn.me/torrents.php?action=advanced&searchstr=${data}&year=${row.year}&inallakas=1&noredirect=1" target="_blank"><i class="fa fa-search float-end"></i></a>`
            : '';
        },
      },
      {
        className: 'align-middle tc-year',
        data: 'year',
      },
      {
        className: 'align-middle tc-tags',
        data: 'tags',
        render: {
          _: function (data, type, row) {
            // This is used for sorting and type detection
            return data ? data.join(', ') : '';
          },
          display: function (data, type, row) {
            const tags = Array.isArray(data) ? data.join(', ') : '';
            return `<textarea class="editable-tags" data-id="${row.imdb_url}" readonly>${tags}</textarea>`;
          },
          filter: function (data, type, row) {
            // This is used for filtering
            return data ? data.join(', ') : '';
          },
        },
      },
      {
        className: 'align-middle tc-akas',
        data: 'akas',
      },
      {
        className: 'align-middle tc-plot',
        data: 'plotText',
        render: function (data) {
          return data ? `<p>${data}</p>` : '';
        },
      },
      {
        className: 'align-middle tc-timestamp',
        data: 'timestamp',
        render: function (data) {
          return data ? formatDate(data) : '';
        },
      },
    ],
    pageLength: 100,
    lengthMenu: [
      [25, 50, 100, 150, 250, 500, -1],
      [25, 50, 100, 150, 250, 500, 'All'],
    ],
    dom: 'lfrBtip',
    buttons: [
      {
        extend: 'copy',
        text: 'Copy to Clipboard',
        className: 'btn btn-primary',
      },
      {
        extend: 'csv',
        text: 'Download as CSV',
        className: 'btn btn-primary',
      },
    ],
    responsive: false,
    stateSave: true,
    stateDuration: 0,
    stateLoadParams: function (settings, data) {},
    stateSaveParams: function (settings, data) {},
  });

  // Event Listeners

  let evtSource;
  $(document).on('click', function (e) {
    if (!$(e.target).closest('#matchesTable').length) {
      $missingTable.find('tbody tr').removeClass('highlighted');
    }
  });
  $checkAllMovies.on('click', function () {
    $(this).prop('disabled', true).text('Checking...');
    evtSource = new EventSource('/movies/check-all-movies');
    evtSource.onmessage = function (event) {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'start':
        case 'progress':
          showToast(
            'info',
            'Checking Movies',
            `Processed: ${data.processedCount ?? 0}/${data.total}, Moved: ${data.total}`
          );
          break;
        case 'complete':
        case 'error':
        case 'end':
          if (evtSource) {
            evtSource.close();
            evtSource = null;
          }
          $checkAllMovies.prop('disabled', false).text('Check & Archive');
          break;
      }
    };
    evtSource.onerror = function (err) {
      showToast(
        'error',
        'Error',
        'Failed to check movies, see server logs.',
        5000
      );
    };
  });
  $checkBannedContent.on('click', function () {
    checkBannedContent(table);
  });
  $hideProcessed.on('change', function () {
    localStorage.setItem('hideProcessed', $(this).is(':checked'));
    applyFilter();
  });
  $missingTable.on('change', '.processed-checkbox', function () {
    const $checkbox = $(this);
    const $row = $checkbox.closest('tr');

    if ($row.hasClass('editing')) {
      console.log('Row is in edit mode, processed state update deferred');
      return;
    }

    const id = $checkbox.data('id');
    const processed = $checkbox.is(':checked');
    updateProcessedState(id, processed);
  });
  $missingTable.on('click', '.edit-icon', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const $row = $(this).closest('tr');
    if ($row.hasClass('editing')) {
      exitEditMode($row);
    } else {
      enterEditMode($row);
    }
  });
  $missingTable.on('click', '.editable-tags', function (e) {
    const $row = $(this).closest('tr');
    if (!$row.hasClass('editing')) {
      enterEditMode($row);
    }
    if (this._tagify) {
      this._tagify.DOM.input.focus();
    }
  });
  $missingTable.on('click', 'td', function (e) {
    if (
      $(e.target).closest('.editable-tags, .edit-icon, .processed-checkbox')
        .length
    ) {
      return;
    }

    const $row = $(this).closest('tr');
    if ($row.hasClass('editing') || $(this).index() < 2) {
      return;
    }

    let cellData = $(this).text().trim();
    const imgTag = $(this).find('img');
    if (imgTag.length > 0) {
      cellData = imgTag.attr('src');
    }

    const clipboardText = $(this)
      .find('[data-clipboard-text]')
      .data('clipboard-text');

    navigator.clipboard
      .writeText(clipboardText || cellData)
      .then(() => {
        showToast('success', 'Copied', 'Cell content copied to clipboard');
        highlightRow($row);
      })
      .catch(err => {
        showToast('error', 'Error', 'Failed to copy content');
      });

    e.stopPropagation();
  });
  $moveCheckedToIgnored.on('click', function () {
    $(this).prop('disabled', true).text('Moving...');
    let progressToast = showToast(
      'info',
      'Moving ✔ Movies',
      'Starting process...',
      false
    );

    $.ajax({
      url: '/movies/move-checked-to-ignored',
      method: 'POST',
      success: function (response) {
        showToast(
          'success',
          'Move Completed',
          `Moved ${response.movedCount} movies to Ignored list`
        );
        location.reload();
      },
      error: function (xhr, status, error) {
        showToast(
          'error',
          'Error',
          'Failed to move movies: ' +
            (xhr.responseJSON ? xhr.responseJSON.error : error)
        );
      },
      complete: function () {
        $moveCheckedToIgnored
          .prop('disabled', false)
          .text('Move ✔ to Ignored');
        if (progressToast) {
          iziToast.hide({}, progressToast);
        }
      },
    });
  });
  $toggleAllProcessed.on('click', function () {
    const allProcessed =
      $('.processed-checkbox:checked').length ===
      $('.processed-checkbox').length;
    const newState = !allProcessed;
    const ids = table
      .column(2)
      .data()
      .toArray()
      .map(row => row.imdb_url.split('/title/')[1].replace('/', ''));
    updateAllProcessedStates(newState, ids);
  });
  $trackerUrlOpen.on('click', function (e) {
    e.preventDefault();
    const visibleRows = table.rows({ page: 'current' }).nodes();
    const trackerUrls = [];
    $(visibleRows).each(function () {
      const url = table.cell(this, 4).data();
      if (url) {
        trackerUrls.push(url);
      }
    });
    trackerUrls.forEach(url => window.open(url, '_blank'));
  });

  // Initial Setup
  const savedHideProcessed = localStorage.getItem('hideProcessed');
  if (savedHideProcessed !== null) {
    $hideProcessed
      .prop('checked', savedHideProcessed === 'true')
      .trigger('change');
  }
  table.draw();

  // AJAX Update Functions
  function updateAllProcessedStates(newState, ids) {
    $.ajax({
      type: 'POST',
      url: '/movies/update_all_processed',
      data: JSON.stringify({ ids: ids, processed: newState.toString() }),
      contentType: 'application/json',
      success: function (response) {
        if (response.updatedCount > 0) {
          table.rows().every(function (rowIdx, tableLoop, rowLoop) {
            const data = this.data();
            data.processed = newState;
            this.data(data);
            $(this.node())
              .find('.processed-checkbox')
              .prop('checked', newState);
          });
          table.draw();
          applyFilter();
          showToast(
            'success',
            'Updated',
            `${response.updatedCount} movies ${newState ? 'marked as processed' : 'unmarked as processed'}`
          );
        } else {
          showToast(
            'info',
            'No Updates',
            'No changes were needed. All movies are already in the desired state.'
          );
        }
      },
      error: function (xhr, status, error) {
        console.error('Failed to update processed statuses:', error);
        console.error('Server response:', xhr.responseText);
        showToast(
          'error',
          'Error',
          'Failed to update processed states: ' + error
        );
      },
    });
  }
  function updateProcessedState(id, processed) {
    $.ajax({
      type: 'POST',
      url: '/movies/update_processed',
      data: JSON.stringify({ id: id, processed: processed.toString() }),
      contentType: 'application/json',
      success: function () {
        const row = table.row((idx, data) => data.imdb_url === id);
        if (row.length) {
          const rowData = row.data();
          rowData.processed = processed;
          row.data(rowData).invalidate().draw(false);
        }
        applyFilter();
      },
      error: function () {
        console.error('Failed to update processed status');
        $(`input[data-id="${id}"]`).prop('checked', !processed);
        showToast('error', 'Error', 'Failed to update processed status');
      },
    });
  }
  function updateTags(id, tags) {
    $.ajax({
      url: '/movies/update-tags',
      method: 'POST',
      data: JSON.stringify({ id, tags }),
      contentType: 'application/json',
      error: function (xhr, status, error) {
        showToast('error', 'Error', 'Failed to update tags: ' + error);
      },
    });
  }

  // UI Helper Functions
  function applyFilter() {
    table.draw();
  }
  function highlightRow($row) {
    $missingTable.find('tbody tr').removeClass('highlighted');
    $row.addClass('highlighted');
  }
  function showToast(type, title, message, timeout = 5000) {
    return iziToast[type]({
      title: title,
      message: message,
      position: 'topRight',
      timeout: timeout,
    });
  }

  // Tagify Related Functions
  function createNewTagify(input) {
    if (!input._tagify) {
      input._tagify = new Tagify(input, {
        callbacks: {
          add: onTagChange,
          remove: onTagChange,
          keydown: function (e) {
            if (e.detail.event.key === 'Escape') {
              const $row = $(e.detail.tagify.DOM.originalInput).closest('tr');
              exitEditMode($row);
            }
          },
        },
      });
    }
    return input._tagify;
  }
  function destroyTagify(input) {
    if (input && input._tagify) {
      input.value = input._tagify.value.map(tag => tag.value).join(', ');
      input._tagify.destroy();
      delete input._tagify;
    }
  }
  function onTagChange(e) {
    const tagify = e.detail.tagify;
    const id = tagify.DOM.originalInput.getAttribute('data-id');
    updateTags(
      id,
      tagify.value.map(tag => tag.value)
    );
  }

  // Edit Mode Functions
  function enterEditMode($row) {
    if (editingRow) {
      exitEditMode(editingRow);
    }

    $row.addClass('editing');
    $row.find('.edit-icon').html('<i class="fas fa-save"></i>');

    $row.find('td').each(function (index) {
      if (![0, 1, 2, 8].includes(index)) {
        const $cell = $(this);
        let cellData = $cell.text().trim();
        if ($cell.find('img').length) {
          cellData = $cell.find('img').attr('src');
        }
        const column = table.column(index).dataSrc();
        $cell.html(
          `<textarea class="form-control" data-column="${column}" rows="3">${cellData}</textarea>`
        );
      }
      if (index === 8) {
        const input = $(this).find('textarea').get(0);
        input.removeAttribute('readonly');
        createNewTagify(input);
      }
    });

    editingRow = $row;
  }

  function exitEditMode($row) {
    if (!$row.hasClass('editing')) {
      return;
    }

    const updatedData = {};
    const originalData = table.row($row).data();

    $row.find('td').each(function (index) {
      if (![0, 1, 2, 8].includes(index)) {
        const $input = $(this).find('textarea');
        if ($input.length) {
          const column = table.column(index).dataSrc();
          updatedData[column] = $input.val();

          if (column === 'poster_url') {
            $(this).html(
              `<img src="${$input.val()}" alt="Poster" class="img-fluid poster-thumb">`
            );
          } else if (column === 'title') {
            const data = $input.val();
            $(this).html(
              data
                ? `${data} <a title="Search by name & year" href="https://passthepopcorn.me/torrents.php?action=advanced&searchstr=${data}&year=${originalData.year}&inallakas=1&noredirect=1" target="_blank"><i class="fa fa-search float-end"></i></a>`
                : ''
            );
          } else if (column === 'url') {
            const data = $input.val();
            $(this).html(
              data
                ? `<a href="${data}" title="${data}" target="_blank">${data}</a>`
                : ''
            );
          } else if (column === 'imdb_url') {
            // Add this condition
            const data = $input.val();
            const imdbId = data.split('/title/')[1].replace('/', '');
            $(this).html(
              `<a href="${data}" target="_blank" data-clipboard-text="${imdbId}">${data}</a>`
            );
          } else {
            $(this).text($input.val());
          }
        }
      } else if (index === 8) {
        const input = $(this).find('textarea').get(0);
        input.setAttribute('readonly', true);
        destroyTagify(input);
      }
    });

    const $checkbox = $row.find('.processed-checkbox');
    const newProcessedState = $checkbox.is(':checked');
    if (newProcessedState !== originalData.processed) {
      updatedData.processed = newProcessedState;
    }

    $.ajax({
      type: 'POST',
      url: '/movies/update_movie',
      data: JSON.stringify(updatedData),
      contentType: 'application/json',
      success: function (response) {
        showToast('success', 'Updated', 'Movie data updated successfully');
        if ('processed' in updatedData) {
          updateProcessedState($checkbox.data('id'), updatedData.processed);
        }
      },
      error: function (xhr, status, error) {
        showToast('error', 'Error', 'Failed to update movie data');
        $checkbox.prop('checked', originalData.processed);
      },
    });

    $row.find('.edit-icon').html('<i class="fas fa-pencil-alt"></i>');
    $row.removeClass('editing');
    editingRow = null;
  }
}

$(document).ready(initializeMissingMovies);

export { initializeMissingMovies };
