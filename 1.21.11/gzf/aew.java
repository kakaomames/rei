import com.google.common.collect.Sets;
import java.util.Set;

public record aew(int b, boolean c, Set<amt<dwo>> d, int e, int f, int g, boolean h, boolean i, boolean j, ahx k, boolean l) implements aay<adb> {
   public static final aao<xq, aew> a = aay.a(aew::a, aew::new);

   private aew(xq $$0) {
      this($$0.readInt(), $$0.readBoolean(), (Set)$$0.a(Sets::newHashSetWithExpectedSize, ($$0x) -> {
         return $$0x.a(mj.bE);
      }), $$0.l(), $$0.l(), $$0.l(), $$0.readBoolean(), $$0.readBoolean(), $$0.readBoolean(), new ahx($$0), $$0.readBoolean());
   }

   public aew(int param1, boolean param2, Set<amt<dwo>> param3, int param4, int param5, int param6, boolean param7, boolean param8, boolean param9, ahx param10, boolean param11) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
      this.f = $$4;
      this.g = $$5;
      this.h = $$6;
      this.i = $$7;
      this.j = $$8;
      this.k = $$9;
      this.l = $$10;
   }

   private void a(xq $$0) {
      $$0.q(this.b);
      $$0.a(this.c);
      $$0.a(this.d, wx::b);
      $$0.c(this.e);
      $$0.c(this.f);
      $$0.c(this.g);
      $$0.a(this.h);
      $$0.a(this.i);
      $$0.a(this.j);
      this.k.a($$0);
      $$0.a(this.l);
   }

   public aba<aew> a() {
      return ahz.T;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.b;
   }

   public boolean e() {
      return this.c;
   }

   public Set<amt<dwo>> f() {
      return this.d;
   }

   public int g() {
      return this.e;
   }

   public int h() {
      return this.f;
   }

   public int i() {
      return this.g;
   }

   public boolean j() {
      return this.h;
   }

   public boolean k() {
      return this.i;
   }

   public boolean l() {
      return this.j;
   }

   public ahx m() {
      return this.k;
   }

   public boolean n() {
      return this.l;
   }
}
