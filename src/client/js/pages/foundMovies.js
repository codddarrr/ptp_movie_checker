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
import 'izitoast/dist/css/iziToast.min.css';
import { getServerData } from './missingMovies.js';

$(document).ready(function () {
  const $initializeDatatables = $('#initializeDatatables');
  $initializeDatatables.prop('disabled', false);
  $initializeDatatables.on('click', function () {
    $('#foundTable').DataTable({
      dom: 'lfrBtip',
      pageLength: 100,
      lengthMenu: [
        [25, 50, 100, 150, 250, 500, -1],
        [25, 50, 100, 150, 250, 500, 'All'],
      ],
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
  });
});
