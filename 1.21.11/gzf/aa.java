import aa.1;
import java.util.Date;

public interface aa {
   fna a();

   String b();

   String c();

   int d();

   azz a(azn var1);

   Date e();

   boolean f();

   public static record a(String a, String b, fna c, int d, azz e, azz f, Date g, boolean h) implements aa {
      public a(String param1, String param2, fna param3, int param4, azz param5, azz param6, Date param7, boolean param8) {
         this.a = $$0;
         this.b = $$1;
         this.c = $$2;
         this.d = $$3;
         this.e = $$4;
         this.f = $$5;
         this.g = $$6;
         this.h = $$7;
      }

      public azz a(azn $$0) {
         azz var10000;
         switch(1.a[$$0.ordinal()]) {
         case 1:
            var10000 = this.e;
            break;
         case 2:
            var10000 = this.f;
            break;
         default:
            throw new MatchException((String)null, (Throwable)null);
         }

         return var10000;
      }

      public String b() {
         return this.a;
      }

      public String c() {
         return this.b;
      }

      public fna a() {
         return this.c;
      }

      public int d() {
         return this.d;
      }

      public azz g() {
         return this.e;
      }

      public azz h() {
         return this.f;
      }

      public Date e() {
         return this.g;
      }

      public boolean f() {
         return this.h;
      }
   }
}
