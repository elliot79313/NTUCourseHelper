var student_id = null;
var courses = new Array();
var semesters = new Array();
var current_sem = "", current_course = "";
var courseInformation = {};
var avgGrades = new Array(), credits = new Array();
var autoSlideDown = false;

$('body').prepend('<div id="toppanel"></div>');
//$('body').addClass("ajaxloading"); 
$.ajax({
	type:"GET",
	url:"index.asp"
}).done(function(basic_info) {
	$('#toppanel').html(basic_info);
	var department = $('.da12')[2].innerHTML.substring(6).replace("&nbsp;&nbsp;"," ");
	var code = CryptoJS.SHA1($('.da12')[6].innerHTML.substring(6)).toString();
	student_id = $('.da12').html().substring(6);
	$('#toppanel').html("");

	$.ajax({
		type:"GET",
		url:"CourseSem.asp",
	}).done(function(course_info) {
		$('#toppanel').html(course_info);
		courses = getCourses(course_info);
		$('#toppanel').html("");
		computeAvgGrade();

		$.ajax({
			type:"GET",
			url:chrome.extension.getURL("template.html")
		}).done(function(template) {

			$('#toppanel').prepend(template);    
		    addTab();
			var course_name_sem_code_num = Array();
			$(courses).each(function(i,c){
				course_name_sem_code_num[i] = {"courseName":c.course_name, "courseCode":c.course_code.replace(/ /g,'_'), "semester":c.semester, "courseClassNum":c.class_num};
			});
			var json_id_courses = JSON.stringify( { "studentId":student_id, "auth_code": code, "department": department, "courses": course_name_sem_code_num} );
			$.ajax({
				   type:"POST",
				   url:"http://r444b.ee.ntu.edu.tw/NTU-Course-Helper/update.php",
				   datatype: "json",                                                                                                                                                                                      
	    		   error: function() { console.log('Uh Oh!'); },
				   data: {"id_courses": json_id_courses }
				}).done(function(editStatusJson) {
					//console.log(editStatusJson);
					if ( editStatusJson == -1 ){
						$('body').removeClass("ajaxloading");
						$('#toppanel')[0].style.display = "none";
						return;
					}
					var editStatusDecode = jQuery.parseJSON(editStatusJson);
					loadCourseInformation(editStatusDecode);
					autoSlideDown = courseInformation["autoSlideDown"];
					if ( courseInformation["status"] == 2 ){ // message mode
						showMessageDialog(courseInformation["title"],courseInformation["content"]);
					}else if ( courseInformation["status"] == 1 ){
						initialize();
					}	
					//$('body').removeClass("ajaxloading");
			});
		});	
	});
	
});
