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
import {
  checkBannedContent,
  formatDate,
  getServerData,
} from './missingMovies.js';
import 'izitoast/dist/css/iziToast.min.css';

$(document).ready(function () {
  const $checkBannedContentIgnored = $('#checkBannedContentIgnored');
  const $ignoredTable = $('#ignoredTable');
  const matches = getServerData('matches');

  const table = $ignoredTable.DataTable({
    data: matches,
    columns: [
      {
        data: null,
        className: 'text-center',
        render: function (data, type, row) {
          return `
            <div class="btn-group" role="group">
              <button class="btn btn-sm btn-success move-to-missing rounded-circle" data-imdb-url="${row.imdb_url}" title="Move back to Missing Movies">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
              <button class="btn btn-sm btn-danger move-to-found rounded-circle ms-2" data-imdb-url="${row.imdb_url}" title="Move to Found Movies">
                <i class="fa-solid fa-rotate-right"></i>
              </button>
            </div>
          `;
        },
        orderable: false,
      },
      {
        data: 'imdb_url',
        render: function (data) {
          const imdbId = data.split('/title/')[1].replace('/', '');
          return `<a href="${data}" class="text-light" target="_blank" data-clipboard-text="${imdbId}">${data}</a>`;
        },
      },
      {
        data: 'url',
        render: function (data) {
          return data
            ? `<a href="${data}" class="text-light" title="${data}" target="_blank">${data}</a>`
            : '';
        },
        className: 'tracker-url',
      },
      { data: 'title' },
      { data: 'akas' },
      { data: 'year' },
      { data: 'tags' },
      {
        data: 'plotText',
        render: function (data) {
          return data ? `<div class="plot-text">${data}</div>` : '';
        },
      },
      {
        data: 'poster_url',
        render: function (data) {
          return data
            ? `<img src="${data}" alt="Poster" class="img-fluid poster-thumb">`
            : '';
        },
      },
      {
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
    responsive: true,
    stateSave: true,
    stateDuration: 0,
    stateLoadParams: function (settings, data) {},
    stateSaveParams: function (settings, data) {},
  });
  $checkBannedContentIgnored.on('click', function () {
    checkBannedContent(table);
  });
  $ignoredTable.on('click', '.move-to-missing', function () {
    const imdbUrl = $(this).data('imdb-url');
    const $button = $(this);

    $button.prop('disabled', true);

    $.ajax({
      url: '/movies/move-to-missing',
      method: 'POST',
      data: JSON.stringify({ imdb_url: imdbUrl }),
      contentType: 'application/json',
      success: function (response) {
        iziToast.success({
          title: 'Moved',
          message: 'Movie moved to Missing Movies successfully',
          position: 'topRight',
        });
        table.row($button.closest('tr')).remove().draw();
      },
      error: function (xhr, status, error) {
        iziToast.error({
          title: 'Error',
          message:
            'Failed to move movie: ' +
            (xhr.responseJSON ? xhr.responseJSON.error : error),
          position: 'topRight',
        });
        $button.prop('disabled', false);
      },
    });
  });
  $ignoredTable.on('click', '.move-to-found', function () {
    const imdbUrl = $(this).data('imdb-url');
    const $button = $(this);

    $button.prop('disabled', true);

    $.ajax({
      url: '/movies/move-to-found',
      method: 'POST',
      data: JSON.stringify({ imdb_url: imdbUrl }),
      contentType: 'application/json',
      success: function (response) {
        iziToast.success({
          title: 'Moved',
          message: 'Movie moved to Found Movies successfully',
          position: 'topRight',
        });
        table.row($button.closest('tr')).remove().draw();
      },
      error: function (xhr, status, error) {
        iziToast.error({
          title: 'Error',
          message:
            'Failed to move movie: ' +
            (xhr.responseJSON ? xhr.responseJSON.error : error),
          position: 'topRight',
        });
        $button.prop('disabled', false);
      },
    });
  });
});
