from django.urls import path
from django.contrib import admin
from django.urls import path, include
from TenderApp import views 

from . import views

urlpatterns = [
    path('', views.index, name='home'),
    path("index.html", views.index, name="index"),
	       path("TenderLogin.html", views.TenderLogin, name="TenderLogin"),
	       path("TenderLoginAction", views.TenderLoginAction, name="TenderLoginAction"),
	       path("index.html", views.Logout, name="Logout"),
	       path("Register.html", views.Register, name="Register"),
	       path("BidderLoginAction", views.BidderLoginAction, name="BidderLoginAction"),
	       path("BidderLogin.html", views.BidderLogin, name="BidderLogin"),
	       path("CreateTender.html", views.CreateTender, name="CreateTender"),
	       path("CreateTenderAction", views.CreateTenderAction, name="CreateTenderAction"),
	       path("BidTender", views.BidTender, name="BidTender"),
	       path("ViewTender", views.ViewTender, name="ViewTender"),
	       path("EvaluateTender", views.EvaluateTender, name="EvaluateTender"),
	       path("WinnerSelection", views.WinnerSelection, name="WinnerSelection"),
	       path("Signup", views.Signup, name="Signup"),
	       path("BidTenderActionPage", views.BidTenderActionPage, name="BidTenderActionPage"),
	       path("BidTenderAction", views.BidTenderAction, name="BidTenderAction"),
]