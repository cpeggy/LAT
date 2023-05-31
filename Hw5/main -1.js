$(document).ready(function(){
    //do something
    $("#thisButton").click(function(){
        processImage();
    });
    $("#inputImageFile").change(function(e){
        processImageFile(e.target.files[0]);
    });
});

function processImageFile(imageObject) {
    var url = "https://eastus.api.cognitive.microsoft.com/";
    var uriBase = url + "vision/v2.1/analyze";

    var params = {
        "visualFeatures": "Categories,Objects,Color",
        "details": "",
        "language": "en",
    };

    var sourceImageUrl = URL.createObjectURL(imageObject);
    document.querySelector("#sourceImage").src = sourceImageUrl;

    var formData = new FormData();
    formData.append("file", imageObject);

    $.ajax({
        url: uriBase + "?" + $.param(params),
        beforeSend: function (xhrObj) {
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
        },
        type: "POST",
        processData: false,
        contentType: false,
        data: formData,
    })
    .done(function (data) {
        $("#responseTextArea").val(JSON.stringify(data, null, 2));
        $("#picDescription").empty();

        $("#picDescription").append("Main Color: " + data.color.dominantColorForeground + "<br>");
        $("#picDescription").append("Object: " + data.objects[0].object + "<br>");
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
        var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
        errorString += (jqXHR.responseText === "") ? "" : jQuery.parseJSON(jqXHR.responseText).message;
        alert(errorString);
    });
};

function processImage() {
    var url = "https://eastus.api.cognitive.microsoft.com/";
    var uriBase = url + "vision/v2.1/analyze";

    var params = {
        "visualFeatures": "Categories,Objects,Color",
        "details": "",
        "language": "en",
    };

    var sourceImageUrl = document.getElementById("inputImage").value;
    document.querySelector("#sourceImage").src = sourceImageUrl;

    $.ajax({
        url: uriBase + "?" + $.param(params),
        beforeSend: function(xhrObj){
            xhrObj.setRequestHeader("Content-Type","application/json");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
        },
        type: "POST",
        data: '{"url": "' + sourceImageUrl + '"}',
    })
    .done(function(data) {
        $("#responseTextArea").val(JSON.stringify(data, null, 2));
        $("#picDescription").empty();
        
        $("#picDescription").append("Main Color: " + data.color.dominantColorForeground + "<br>");
        $("#picDescription").append("Object: " + data.objects[0].object + "<br>");
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
        errorString += (jqXHR.responseText === "") ? "" : jQuery.parseJSON(jqXHR.responseText).message;
        alert(errorString);
    });
};
