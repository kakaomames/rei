import org.jspecify.annotations.Nullable;

public class afo implements aay<adb> {
   public static final aao<wx, afo> a = aay.a(afo::a, afo::new);
   private final double b;
   private final double c;
   private final double d;
   private final int e;
   private final ep.a f;
   private final ep.a g;
   private final boolean h;

   public afo(ep.a $$0, double $$1, double $$2, double $$3) {
      this.f = $$0;
      this.b = $$1;
      this.c = $$2;
      this.d = $$3;
      this.e = 0;
      this.h = false;
      this.g = null;
   }

   public afo(ep.a $$0, cgk $$1, ep.a $$2) {
      this.f = $$0;
      this.e = $$1.aA();
      this.g = $$2;
      ftm $$3 = $$2.a($$1);
      this.b = $$3.g;
      this.c = $$3.h;
      this.d = $$3.i;
      this.h = true;
   }

   private afo(wx $$0) {
      this.f = (ep.a)$$0.b(ep.a.class);
      this.b = $$0.readDouble();
      this.c = $$0.readDouble();
      this.d = $$0.readDouble();
      this.h = $$0.readBoolean();
      if (this.h) {
         this.e = $$0.l();
         this.g = (ep.a)$$0.b(ep.a.class);
      } else {
         this.e = 0;
         this.g = null;
      }

   }

   private void a(wx $$0) {
      $$0.a((Enum)this.f);
      $$0.a(this.b);
      $$0.a(this.c);
      $$0.a(this.d);
      $$0.a(this.h);
      if (this.h) {
         $$0.c(this.e);
         $$0.a((Enum)this.g);
      }

   }

   public aba<afo> a() {
      return ahz.am;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public ep.a b() {
      return this.f;
   }

   @Nullable
   public ftm a(dwo $$0) {
      if (this.h) {
         cgk $$1 = $$0.a(this.e);
         return $$1 == null ? new ftm(this.b, this.c, this.d) : this.g.a($$1);
      } else {
         return new ftm(this.b, this.c, this.d);
      }
   }
}
