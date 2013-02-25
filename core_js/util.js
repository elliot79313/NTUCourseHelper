var cm_overall, cm_style, cm_loading, cm_difficulty;

function Course(semester, field, course_code, class_num, credit, course_name, grade) {
	this.semester = semester;
	this.field = field;
	this.course_code = course_code;
	this.class_num = class_num;
	this.credit = credit;
	this.course_name = course_name;
	this.grade = grade;
	
	this.print = function() {
		console.log(this.semester + " [" + this.course_code + "-" + this.class_num + ":" + this.credit + "] " + this.grade);
	};
}

function include(arr,obj) {
    return (arr.indexOf(obj) != -1);
}

var findCoursesBySemester = function(sem) {
	var result = Array();
	if (sem=="全部課程")
		result = courses;
	else{
		for (var i = 0; i < courses.length; ++i) {
			if (courses[i].semester == sem) result.push(courses[i]);
		}
	}
	return result;
}

//  9 columns for university students. 8 columns for Master/PhD students... 
var getCourses = function() {
	var courses = new Array();
	var bachelorShift = 1;
	if ( $('#toppanel tr.sub_g_title > th')[0].parentNode.childNodes.length == 8 )
		bachelorShift = 0;
	$('#toppanel div[class="middle"] tr[class!="sub_g_title"]').each(function() {
		var info = $(this).children();
		var semester = $(info.get(0)).html();
		var field = $(info.get(1))
		.html();
		var course_code = $(info.get(2+bachelorShift)).html();
		var class_num = $(info.get(3+bachelorShift)).html(); if (class_num == "&nbsp;") class_num = "00";
		var credit = $(info.get(4+bachelorShift)).html();
		var course_name = $(info.get(5+bachelorShift)).html().replace(/ /g,'');
		var grade = $(info.get(6+bachelorShift)).html().replace(/&nbsp;/g,'');
		var ps = $(info.get(7+bachelorShift)).html();

		var year = semester.substring(0,3);
		if ( year[0] == '0' )
			year = year.substring(1,3);
		var sem = '上';
		if ( semester.substring(3,4) == "2" )
			sem = '下'
		semester = year + '年' + sem;
		if (course_name.substring(0, 4) == "服務學習" || course_code == "&nbsp;" || ps == "免修" || grade == "") {
			//服務學習 or 操行 or 免修 or 抵免
		} else {
			course = new Course(semester, field, course_code, class_num, credit, course_name, grade);
			//course.print();
			if (!include(semesters, semester)) semesters.push(semester); 
			courses.push(course);
		}
	});
	return courses;
}

var computeAvgGrade = function(){
	$(semesters).each( function(x,sem) {
		var coursem = findCoursesBySemester(sem);
		$(coursem).each(function(ith,c){
			//console.log(c.grade);
		});
		
	});
	
}

var loadButtonImages = function(){
	$.each( $("img.multiOptTip"), function(index){ $("img.multiOptTip")[index].src=chrome.extension.getURL("images/multipleOptions.png");} );
	$.each( $("img.singleOptTip"), function(index){ $("img.singleOptTip")[index].src=chrome.extension.getURL("images/singleOption.png"); } );
	$("img.backToCoursesAndSubmitImg")[0].src = chrome.extension.getURL("images/submit.png");
}

var bindOpinonClick = function(){
	var types = ['overall','style','loading','difficulty']; // do not change the order
	$(types).each( function(ithType,type){ 
		$('.'+type).each( function(ith, obj){
			$(obj).unbind();
			$(obj).bind('click', function(){
				$("#errorMsg").html("");
				var pressPressed = false;
				if ( $('.'+type+'_pressed')[0] === obj )
					pressPressed = true;
				if (ithType>=2) { $('.'+type+'_pressed').each(function(jth,obj2){ $(obj2).toggleClass(type).toggleClass(type+'_pressed'); }); }  // single option
				if ( (ithType>=2) && (pressPressed==true) ){
					return;
				}
				$(obj).toggleClass(type+'_pressed').toggleClass(type); 
			});
		});
	});
}

var levelMapToGrade = function(level){
	grade = 0;
	while (true){ var ith = level.lastIndexOf(' '); if ( ith==-1 ) break; level = level.substring(0,ith); }
	if ( level == 'A+' )	{ grade = 95; }
	else if ( level == 'A' ){ grade = 87; }
	else if ( level == 'A-' ){ grade = 82; }
	else if ( level == 'B+' ){ grade = 78; }
	else if ( level == 'B' ){ grade = 75; }
	else if ( level == 'B-' ){ grade = 70; }
	else if ( level == 'C+' ){ grade = 68; }
	else if ( level == 'C' ){ grade = 65; }
	else if ( level == 'C-' ){ grade = 60; }
	else if ( level == 'F' ){ grade = 50; }
	else if ( level == 'Pass' ){ grade = -2; }
	else if ( level == 'X' ){ grade = 0; }
	else { grade = level; }
	return grade;
}

/*
var gradeMapToPoint = function(grade){
	point = 0;

}
*/

var roundToDecimal = function(number, precision){
    var oneWZeros = Math.pow(10, precision);
    return Math.round( number * oneWZeros) / oneWZeros;
}

var plotHighChartForGrade = function(dataArray){
	var chart;
	// for gradient color
	/* commented because pdf export has bugs
	var originalColors = Highcharts.getOptions().colors;
	Highcharts.getOptions().colors = Highcharts.map(Highcharts.getOptions().colors, function(color) {
	    return {
	        radialGradient: { cx: 0.5, cy: 0.3, r: 0.7 },
	        stops: [
	            [0, color],
	            [1, Highcharts.Color(color).brighten(-0.3).get('rgb')] // darken
	        ]
	    };
	});
	*/
	// Build the chart
    chart = new Highcharts.Chart({
        chart: {
            renderTo: 'chartZone',
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            backgroundColor: '#272727'
        },
        title: {
            text: current_sem + '-成績統計',
            style: {
     			color: 'yellow',
     			font: 'bold 16px "Trebuchet MS", Verdana, sans-serif'
  			}
        },
        tooltip: {
    	    pointFormat: '{series.name}: <b>{point.percentage}%</b>',
        	percentageDecimals: 1
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    color: 'white',
                    connectorColor: 'white',
                    formatter: function() {
                        return '<b>'+ this.point.name +'</b>: '+ this.percentage.toFixed(1) +' %';
                    },
                    style: {
            			font: 'normal 13px Verdana, sans-serif'
        			}
                },
                showInLegend: true
            }
        },
        legend: {
		    itemStyle: {
		        color: 'white',
		        fontWeight: 'bold',
		        font: 'normal 9px Verdana, sans-serif'
		    }
        },
        credits:{enabled:false},
        exporting: {
    		url: 'http://r444b.ee.ntu.edu.tw/NTU-Course-Helper/exporting/index.php'
		},
		colors: ['#FFD700', '#9ACD32', '#00CED1', '#ff6969', '#F3F37B', '#BAE9BA', '#AEF1F1', '#ECD0D0'],
        series: [{
            type: 'pie',
            name: '比例',
            data: dataArray
        }]
    });
	//Highcharts.getOptions().colors = originalColors; // reset the color setting
}

var bindGradeStatClick = function(){
	$("#gradeStat").unbind();
	$("#gradeStat").bind('click',function(){
		var courses_sem = findCoursesBySemester(current_sem);
		var gradeInterval = [0,60,70,80,85,90,95,101];
		var countArray = [0,0,0,0,0,0,0];
		var percentArray = [0,0,0,0,0,0,0];
		$(courses_sem).each(function(ith,obj){
			var g = levelMapToGrade(obj.grade.replace(/ /g,''));
			for ( var i = 1 ; i < gradeInterval.length ; ++i){
				if ( g >= gradeInterval[i-1] && g < gradeInterval[i] ){
					++countArray[i-1];
					break;
				}
			}
		});
		$(countArray).each(function(ith,obj){
			percentArray[ith] = Number((obj.toFixed(4)/courses_sem.length.toFixed(0)).toFixed(3));
		});
		gradeInterval[7]=100;
		var dataArray = [[]];
		for ( var i = 0, j = 0 ; i < gradeInterval.length-1 ; ++i){
			if ( percentArray[i] == 0 )
				continue;
			dataArray[j] = [ gradeInterval[i]+'~'+gradeInterval[i+1]+'分 (' + countArray[i] + '科)', percentArray[i]  ];
			++j;
		}
		plotHighChartForGrade(dataArray);
		$("#gradeStat").fadeOut('fast');
		$("#coursesDiv").fadeOut('fast', function(){ fadeInChartPage(); });
	});
}

// id=(courseCode_classNum).replace(' ','_');
var findCourseByUniqueId = function(id){
	var res;
	$(courses).each(function(ith,obj){
		var tmpId = obj.course_name + "_" + obj.semester + "_" + obj.course_code.replace(/ /g,'_') + "_" + obj.class_num;
		if ( (tmpId===id) ){
			res = obj;
		}
	});
	return res;
}

var submit = function(){
	cm_overall = cm_difficulty = cm_loading = cm_style = "";
	$('div.overall_pressed').each(function(ith,obj){ 	cm_overall += obj.id.toString(); });
	$('div.style_pressed').each(function(ith,obj){ cm_style += obj.id.toString(); });
	$('div.loading_pressed').each(function(ith,obj){ cm_loading = obj.id.toString(); });
	$('div.difficulty_pressed').each(function(ith,obj){ cm_difficulty = obj.id.toString(); });
	if ( (cm_overall+cm_difficulty+cm_loading+cm_style).length==0 ){
		$('#errorMsg').html("注意：您尚未填寫任何課程意見，請填寫後再送出。");
		return false;
	}

	var course_name = current_course.course_name;
	var course_code = current_course.course_code.replace(/ /g,'_');
	var course_class = current_course.class_num;
	var semester = current_course.semester;
	var course_code_num = course_code + "_" + course_class;	    	
	var course_name_sem_code_num = course_name + "_" + semester + "_" + course_code_num;
	
	var json_course_cm = JSON.stringify( {	"studentId":student_id, 
											"courseName": course_name,
											"courseCode": course_code,
											"courseClassNum": course_class,
											"semester": semester,
											"CM_Overall":cm_overall,
											"CM_Style":cm_style,
											"CM_Loading":cm_loading,
											"CM_Difficulty":cm_difficulty
										  } );
	$.ajax( {
			type:"POST",
			url:"http://r444b.ee.ntu.edu.tw/NTU-Course-Helper/postComment.php",
			data: {"comments": json_course_cm }
		}).done(function(data){
			//console.log(data);
			if ( data == 1){
				courseInformation[course_name_sem_code_num].IsEdit = 1;
				$("td[id='toOpinion"+course_name_sem_code_num+"']").html("修改");
			}
	});
	return true;
}

var fadeInChartPage = function(){
	$("#chartPage").fadeIn('fast');
	$("#back").fadeIn('fast');
}

var fadeInCoursePage = function(){
	$("#gradeStat").fadeIn('fast');  
	$("#coursesDiv").fadeIn('fast');
}

var fadeInCommentPage = function(){
	$("#coursesDiv").fadeOut('fast', function(){ $("#opinionDiv").fadeIn('fast');}); 
	$("#opinionDiv")[0].style.display = "inline-block";
	$("#back").fadeIn('fast');
}

var bindToOpinionTableClick = function(){
	$("td.toOpinionButton[id^=toOpinion]").each(function(ith,obj){
		$(obj).bind('click',function(){ 
			current_course = findCourseByUniqueId(obj.id.substring(9)); // filter out prefix "toOpinion"
			$("#courseName").html("課程名稱:"+current_course.course_name);
			resetComments();
			$("#gradeStat").fadeOut('fast');
			fadeInCommentPage();
		});
	});	
}

var resetComments = function(){
	$('div.overall_pressed').each(function(i,obj){obj.setAttribute("class","overall");});
	$('div.style_pressed').each(function(i,obj){obj.setAttribute("class","style");});
	$('div.difficulty_pressed').each(function(i,obj){obj.setAttribute("class","difficulty");});
	$('div.loading_pressed').each(function(i,obj){obj.setAttribute("class","loading");});
}


var bindBackToCourseClick = function(){
	$("#back").unbind();
	$("#back").bind('click', function(){ $("#errorMsg").html(""); $("#chartPage").fadeOut('fast'); $("#opinionDiv").fadeOut('fast',function(){ fadeInCoursePage(); }); });
	$("#backToCoursesAndSubmit").unbind();
	$("#backToCoursesAndSubmit").bind('click', function(){ if ( submit() == false) return; $("#errorMsg").html(""); $("#opinionDiv").fadeOut('fast',function(){fadeInCoursePage();}); });	
}

var bindTabClick = function(){
    $('a.semester-tab').click(function(e) {    	
	    current_sem = $(this).html();
	    var coursesForCurrentSem = findCoursesBySemester(current_sem);
	    $('#courses tbody').html("");
	    for (var i = 0; i < coursesForCurrentSem.length; ++i) {
	    	var course = coursesForCurrentSem[i];
	    	var course_code_num = (course.course_code + "_" + course.class_num).replace(/ /g,'_');
	    	var course_name_sem_code_num = course.course_name+"_"+course.semester+"_"+course_code_num; // for access courseInformation
	    	var editStatus = "進入填寫";
	    	if ( courseInformation[course_name_sem_code_num].IsEdit == 1 )
	    		editStatus = "修改";	
	    	var teacherName = courseInformation[course_name_sem_code_num].TeacherName;    	
		    $('#courses tbody').append("<tr class='course-row' id='" + course_code_num + "'>" + 
		    						   "<td width='200px'>" + course.course_name + "</td>" + 
		    						   "<td>" + teacherName + "</td>" +
		    						   "<td>" + course.grade + "</td>" +
		                               "<td class=\'toOpinionButton\' id=toOpinion" + course_name_sem_code_num + ">" + editStatus + "</td>" + "</tr>");
	    } 
	    $("#courses").trigger("update");
	    loadButtonImages();
	    bindToOpinionTableClick();
	    bindBackToCourseClick();
	    bindOpinonClick();
	    bindGradeStatClick();
	    $("#chartPage").fadeOut('fast');
	    $("#opinionDiv").fadeOut('fast',function(){ fadeInCoursePage(); });
	    if ( $("a.semester-tab-selected").length>0 || autoSlideDown==true ){    // correctify the panel display status
	    	$("#open").click();
	    }
	    $('.semester-tab-selected').each(function(){ $(this).toggleClass("semester-tab").toggleClass("semester-tab-selected"); });
	    $(this).toggleClass("semester-tab-selected").toggleClass("semester-tab");  
    });
}

var loadCourseInformation = function(editStatus){
	$.each(editStatus,function(key,value){
		courseInformation[key] = value;
	});
}

var addTab = function() {
	for (var i = 0; i < semesters.length; ++i) {
		$("<li><a href='#'' class='semester-tab'>" + semesters[i] + "</a></li><li class='sep'>|</li>").insertBefore('#toggle');
	}
	bindTabClick();
}

var initialize = function(mode){
	if ( mode == "open" ){
		//$("#close").click();
		$("#open").click();
		if ( $('a.semester-tab').length > 0 ){
			$('a.semester-tab')[0].click();
		}
	}
	$("#open")[0].style.display = "block";
	if ( $('a.semester-tab-selected').length == 0 && $('a.semester-tab').length > 0 ){
		$('a.semester-tab')[0].click();
	}
}

var showMessageDialog = function(title, html_content){
	$("#msg-modal").html(html_content);
	$("#msg-modal").dialog({
		title: title,
		width: 400,
		height: 250,
		modal: true,
		position:['middle',300],
		closeText: "X",
		closeOnEscape: true,
		show: {
			effect: "clip",
			duration: 200
		},
		hide: {
			effect: "clip",
			duration: 200
		},
		close: function( event, ui ) {
			initialize("open");
		}
	});

}