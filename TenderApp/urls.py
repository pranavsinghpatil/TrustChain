from django.urls import path
from django.contrib import admin
from django.urls import path, include
from TenderApp import views 

from . import views
from .views import OfficerOngoingTenders

urlpatterns = [
    path('Login/', views.Login, name='Login'),
    path('clear-data/', views.ClearTenderData, name='ClearTenderData'),
    path('TenderScreen', views.TenderScreen, name='TenderScreen'),
    path('BidderScreen', views.BidderScreen, name='BidderScreen'),
    path('BidderNotifications', views.BidderNotifications, name='BidderNotifications'),
    path('OfficerNotifications', views.OfficerNotifications, name='OfficerNotifications'),
    path('OfficerViewTenders', views.ViewTender, name='OfficerViewTenders'),
    path('officer/ongoing-tenders/', OfficerOngoingTenders, name='OfficerOngoingTenders'),
    path('EditTender/<str:tender_title>', views.EditTender, name='EditTender'),
    path('DeleteTender', views.DeleteTender, name='DeleteTender'),
    path('CloseTender', views.CloseTender, name='CloseTender'),
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
    path("evaluateReject", views.evaluateReject, name="evaluateReject"),
    path("evaluateWinner", views.evaluateWinner, name="evaluateWinner"),
    path("WinnerSelection", views.WinnerSelection, name="WinnerSelection"),
    path("Signup", views.Signup, name="Signup"),
    path("BidTenderActionPage", views.BidTenderActionPage, name="BidTenderActionPage"),
    path("BidTenderAction", views.BidTenderAction, name="BidTenderAction"),
    path("TenderDetail", views.TenderDetail, name="TenderDetail"),
    # Other paths continue below but are already defined above
    # path("ViewTender", views.ViewTender, name="ViewTender"),
    # path("EvaluateTender", views.EvaluateTender, name="EvaluateTender"),
    # ... etc.
]