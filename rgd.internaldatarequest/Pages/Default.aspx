<%@ Register TagPrefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<WebPartPages:AllowFraming runat="server" />

<!DOCTYPE html>
<html lang="en">
<head>
    <title>Reasearch Governance - Data Requests</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <script type="text/javascript" src="../Scripts/jquery-1.9.1.min.js"></script>
    <script type="text/javascript" src="_layouts/15/init.js"></script>
    <script type="text/javascript" src="_layouts/15/MicrosoftAjax.js"></script>
    <script type="text/javascript" src="_layouts/15/SP.RequestExecutor.js"></script>
    <script type="text/javascript" src="_layouts/15/SP.Core.js"></script>
    <script type="text/javascript" src="_layouts/15/sp.runtime.js"></script>
    <script type="text/javascript" src="_layouts/15/sp.js"></script>

    <script type="text/javascript" src="../Scripts/bootstrap-3.3.6.min.js"></script>
    <script type="text/javascript" src="../Scripts/angular-1.4.8.min.js"></script>
    <script type="text/javascript" src="../Scripts/angular-route-1.3.14.min.js"></script>
    <script type="text/javascript" src="../Scripts/mainApp.js"></script>
    <script type="text/javascript" src="../Scripts/bootstrap-datepicker.js"></script>
    <script type="text/javascript" src="../Scripts/angular-sanitize.js"></script>
    <script type="text/javascript" src="../Scripts/dirPagination.js"></script>
    <script type="text/javascript" src="../Scripts/ng-file-model.js"></script>
    <script type="text/javascript" src="../Scripts/jquery.flot.js"></script>
    <script type="text/javascript" src="../Scripts/angular-flot.js"></script>
    <script type="text/javascript" src="../Scripts/sp-peoplepicker.js"></script>
    <!-- <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/ng-csv/0.3.6/ng-csv.min.js"></script> -->
    <script type="text/javascript" src="https://cdn.jsdelivr.net/alasql/0.3/alasql.min.js"></script>


    <script src="../Scripts/flot/0.8.3/jquery.flot.categories.min.js"></script>
    <script src="../Scripts/flot/0.8.3/jquery.flot.pie.min.js"></script>
    <script src="../Scripts/flot/0.8.3/jquery.flot.resize.min.js"></script>

    <link rel="stylesheet" href="../Content/css/bootstrap.min-3.3.6.css" />
    <link rel="stylesheet" href="../Content/css/bootstrap-theme-3.3.6.min.css" />
    <link href="../Content/css/datepicker.min.css" rel="stylesheet" />
    <link href="../Content/css/sp-peoplepicker.min.css" rel="stylesheet" />

    <style type="text/css">
        .gi-1X {
            font-size: 1em;
        }

        .gi-2X {
            font-size: 2em;
        }

        .gi-3X {
            font-size: 3em;
        }

        .gi-4X {
            font-size: 4em;
        }

        .gi-5X {
            font-size: 5em;
        }

        .huge {
            font-size: 40px;
        }

        .panel-green {
            border-color: #5cb85c;
        }

            .panel-green .panel-heading {
                border-color: #5cb85c;
                color: #fff;
                background-color: #5cb85c;
            }

            .panel-green a {
                color: #5cb85c;
            }

                .panel-green a:hover {
                    color: #3d8b3d;
                }

        .panel-red {
            border-color: #d9534f;
        }

            .panel-red .panel-heading {
                border-color: #d9534f;
                color: #fff;
                background-color: #d9534f;
            }

            .panel-red a {
                color: #d9534f;
            }

                .panel-red a:hover {
                    color: #b52b27;
                }

        .panel-yellow {
            border-color: #f0ad4e;
        }

            .panel-yellow .panel-heading {
                border-color: #f0ad4e;
                color: #fff;
                background-color: #f0ad4e;
            }

            .panel-yellow a {
                color: #f0ad4e;
            }

                .panel-yellow a:hover {
                    color: #df8a13;
                }

        .panel-orange {
            border-color: #ff8c00;
        }

            .panel-orange .panel-heading {
                border-color: #ff8c00;
                color: #fff;
                background-color: #ff8c00;
            }

            .panel-orange a {
                color: #ff8c00;
            }

                .panel-orange a:hover {
                    color: #ff6200;
                }

        .border-bottom {
            border-bottom: 1px solid #f5eaea;
        }
    </style>
</head>
<body data-ng-app="mainApp" id="main-content">
    <div class="container-fluid">
        <div id="body" data-ng-app="mainApp">
            <div class="col-md-12">
                <div class="panel panel-info">
                    <div class="panel-heading">Shortcuts</div>
                    <div class="panel-body">
                        <ul class="nav navbar-nav">
                            <li><a href="#dashboard"><span class="glyphicon glyphicon-dashboard"></span>&nbsp;Dashboad</a></li>
                            <li><a href="#listRequests"><span class="glyphicon glyphicon-list-alt"></span>&nbsp;All Requests</a></li>
                            <li><a href="#addRequest"><span class="glyphicon glyphicon-plus-sign glyphicon-5x"></span>&nbsp;New Request</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="col-md-12">
                <div id="notification-area">
                </div>
                <div class="panel panel-info">
                    <div class="panel-body" data-ng-view>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script type="text/javascript">
        $(document).ready(function () {
            //Initialize DatePicker
            $('body').on('click', $('#requestDate, #estEndDateDataUse, #dataReleaseDate, #protocolApprovalDate'), function () {
                $('#estDataUseEndDate').datepicker({
                    format: 'yyyy-mm-dd',
                    startDate: '-0d',
                    autoclose: true
                });

                $('#requestDate, #dataReleaseDate, #approvedProtocolDate').datepicker({
                    format: 'yyyy-mm-dd',
                    endDate: '+0d',
                    autoclose: true
                });

                /*$('#dataReleaseDate').datepicker({
                    format: 'yyyy-mm-dd',
                    endDate: '+0d',
                    autoclose: true
                });*/

            })

            //flot chart manipulations
            $('flot > div').bind('plotHover', function (event, pos, item) {
                if (item) {
                    alert(item.series.label);
                }
            });

        });
    </script>

    <script type="text/javascript">
        "use strict";
        window.Communica = window.Communica || {};

        $(document).ready(function () {
            Communica.Part.init();
        });

        Communica.Part = {
            senderId: '',

            init: function () {
                var params = document.URL.split("?")[1].split("&");
                for (var i = 0; i < params.length; i = i + 1) {
                    var param = params[i].split("=");
                    if (param[0].toLowerCase() == "senderid")
                        this.senderId = decodeURIComponent(param[1]);
                }


                this.adjustSize();
            },

            adjustSize: function () {
                var step = 30,
                    newHeight,
                    contentHeight = $('#main-content').height(),
                    resizeMessage = '<message senderId={Sender_ID}>resize({Width}, {Height})</message>';

                newHeight = (step - (contentHeight % step)) + contentHeight;

                resizeMessage = resizeMessage.replace("{Sender_ID}", this.senderId);
                resizeMessage = resizeMessage.replace("{Height}", newHeight);
                resizeMessage = resizeMessage.replace("{Width}", "100%");

                window.parent.postMessage(resizeMessage, "*");
            }
        };
    </script>


</body>
</html>
