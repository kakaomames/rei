import java.util.Optional;
import org.jspecify.annotations.Nullable;

public record ahx(jd<esh> a, amt<dwo> b, long c, dwl d, @Nullable dwl e, boolean f, boolean g, Optional<jc> h, int i, int j) {
   public ahx(xq $$0) {
      this((jd)esh.j.decode($$0), $$0.a(mj.bE), $$0.readLong(), dwl.a($$0.readByte()), dwl.b($$0.readByte()), $$0.readBoolean(), $$0.readBoolean(), $$0.b(wx::g), $$0.l(), $$0.l());
   }

   public ahx(jd<esh> param1, amt<dwo> param2, long param3, dwl param5, @Nullable dwl param6, boolean param7, boolean param8, Optional<jc> param9, int param10, int param11) {
      this.a = $$0;
      this.b = $$1;
      this.c = $$2;
      this.d = $$3;
      this.e = $$4;
      this.f = $$5;
      this.g = $$6;
      this.h = $$7;
      this.i = $$8;
      this.j = $$9;
   }

   public void a(xq $$0) {
      esh.j.encode($$0, this.a);
      $$0.b(this.b);
      $$0.b(this.c);
      $$0.l(this.d.a());
      $$0.l(dwl.a(this.e));
      $$0.a(this.f);
      $$0.a(this.g);
      $$0.a(this.h, wx::a);
      $$0.c(this.i);
      $$0.c(this.j);
   }

   public jd<esh> a() {
      return this.a;
   }

   public amt<dwo> b() {
      return this.b;
   }

   public long c() {
      return this.c;
   }

   public dwl d() {
      return this.d;
   }

   @Nullable
   public dwl e() {
      return this.e;
   }

   public boolean f() {
      return this.f;
   }

   public boolean g() {
      return this.g;
   }

   public Optional<jc> h() {
      return this.h;
   }

   public int i() {
      return this.i;
   }

   public int j() {
      return this.j;
   }
}
